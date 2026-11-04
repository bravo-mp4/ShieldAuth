import { Router, Request, Response } from "express";
import crypto from "crypto";
import {
  createUser,
  getUserByEmail,
  verifyPassword,
  pool,
  PASSWORD_MIN_LENGTH,
  PASSWORD_MAX_BYTES,
} from "./database";
import { authenticateToken, requireAdmin, signToken } from "./middleware/auth";
import {
  auditLog,
  authLimiter,
  licenseValidationLimiter,
  publicWriteLimiter,
} from "./middleware/security";
import { heartbeat, validateInputError, validateLicense } from "./license";
import { sendWebhook, triggerWebhook, validateWebhookUrl } from "./webhooks";
import * as AdminRoutes from "./admin-routes";
import logger from "./logger";

const router = Router();

// --- Helpers ---

function ownerEmail(req: Request): string {
  return req.user!.email;
}

/** Parses an integer from user input and clamps it to [min, max]. */
export function clampInt(value: unknown, min: number, max: number, fallback: number): number {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  if (Number.isNaN(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

function optionalText(value: unknown, max: number): string | null {
  if (value === undefined || value === null || value === "") return null;
  return typeof value === "string" ? value.slice(0, max) : null;
}

async function userOwnsApp(email: string, appId: unknown): Promise<boolean> {
  if (typeof appId !== "string") return false;
  const result = await pool.query("SELECT 1 FROM applications WHERE app_id = $1 AND owner_email = $2", [
    appId,
    email,
  ]);
  return result.rows.length > 0;
}

async function userOwnsLicense(email: string, licenseKey: unknown): Promise<boolean> {
  if (typeof licenseKey !== "string") return false;
  const result = await pool.query(
    `SELECT 1 FROM licenses l JOIN applications a ON l.app_id = a.app_id
     WHERE l.license_key = $1 AND a.owner_email = $2`,
    [licenseKey, email]
  );
  return result.rows.length > 0;
}

async function deleteLicenses(licenseKeys: string[]) {
  // hwid_slots and sessions reference licenses, so clear them first.
  await pool.query("DELETE FROM hwid_slots WHERE license_key = ANY($1)", [licenseKeys]);
  await pool.query("DELETE FROM sessions WHERE license_key = ANY($1)", [licenseKeys]);
  return pool.query("DELETE FROM licenses WHERE license_key = ANY($1)", [licenseKeys]);
}

function generateLicenseKey(): string {
  return crypto.randomBytes(16).toString("hex").toUpperCase();
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ============================================
// AUTH
// ============================================

router.post("/auth/login", authLimiter, async (req: Request, res: Response) => {
  const { email, password } = req.body ?? {};

  if (typeof email !== "string" || typeof password !== "string" || !email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  const user = await getUserByEmail(email);
  // verifyPassword always runs bcrypt, even for unknown emails, so response
  // time doesn't reveal which addresses have accounts.
  const isValid = await verifyPassword(password, user?.password_hash ?? null);

  if (!user || !isValid || user.is_banned) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  await pool.query("UPDATE users SET last_login = NOW() WHERE id = $1", [user.id]);

  return res.json({
    token: signToken(user),
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
  });
});

router.post("/auth/register", authLimiter, async (req: Request, res: Response) => {
  const { email, password, name } = req.body ?? {};

  if (typeof email !== "string" || typeof password !== "string" || !email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }
  if (email.length > 255 || !EMAIL_PATTERN.test(email)) {
    return res.status(400).json({ message: "Invalid email format" });
  }
  if (password.length < PASSWORD_MIN_LENGTH) {
    return res.status(400).json({ message: `Password must be at least ${PASSWORD_MIN_LENGTH} characters` });
  }
  if (Buffer.byteLength(password, "utf8") > PASSWORD_MAX_BYTES) {
    return res.status(400).json({ message: `Password must be at most ${PASSWORD_MAX_BYTES} bytes` });
  }

  let user;
  try {
    user = await createUser(email, password, optionalText(name, 255) ?? undefined);
  } catch (error: any) {
    if (error.message === "User with this email already exists") {
      return res.status(409).json({ message: "User already exists" });
    }
    throw error;
  }

  return res.status(201).json({
    token: signToken(user),
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
  });
});

// Tokens are stateless; the client discards its copy. Bans and deletions
// still take effect at once because authenticateToken re-reads the user.
router.post("/auth/logout", authenticateToken, (_req: Request, res: Response) => {
  res.json({ message: "Logged out successfully" });
});

router.get("/auth/me", authenticateToken, (req: Request, res: Response) => {
  res.json({ user: req.user });
});

// ============================================
// SDK: LICENSE VALIDATION
// ============================================

router.post("/validate", licenseValidationLimiter, async (req: Request, res: Response) => {
  const body = req.body ?? {};
  const problem = validateInputError(body);
  if (problem) {
    return res.status(400).json({ valid: false, message: problem });
  }

  const response = await validateLicense({
    app_id: body.app_id,
    license_key: body.license_key,
    hwid: body.hwid,
    ip: req.ip || "",
    userAgent: req.get("user-agent") || "",
  });
  res.json(response);
});

router.post("/heartbeat", licenseValidationLimiter, async (req: Request, res: Response) => {
  // The SDKs send session_id in the body; older clients used a header.
  const sessionId = req.body?.session_id ?? req.get("session-id");
  const result = await heartbeat(sessionId);
  res.status(result.valid ? 200 : 401).json(result);
});

// ============================================
// PLATFORM ADMIN (role = admin)
// ============================================

router.get("/platform/stats", requireAdmin, AdminRoutes.getAdminStats);
router.get("/platform/users", requireAdmin, AdminRoutes.getAllUsers);
router.put("/platform/users/:id/ban", requireAdmin, auditLog("ban_user"), AdminRoutes.banUser);
router.put("/platform/users/:id/role", requireAdmin, auditLog("change_role"), AdminRoutes.changeUserRole);
router.put("/platform/licenses/:key/extend", requireAdmin, auditLog("extend_license"), AdminRoutes.extendLicense);
router.put("/platform/licenses/:key/expire", requireAdmin, auditLog("expire_license"), AdminRoutes.forceExpireLicense);
router.post("/platform/hwid/blacklist", requireAdmin, auditLog("blacklist_hwid"), AdminRoutes.blacklistHWID);

// Site content (blog, changelog) is edited by platform admins only.
router.post("/admin/blog", requireAdmin, auditLog("create_blog"), AdminRoutes.createBlogPost);
router.put("/admin/blog/:id", requireAdmin, auditLog("update_blog"), AdminRoutes.updateBlogPost);
router.delete("/admin/blog/:id", requireAdmin, auditLog("delete_blog"), AdminRoutes.deleteBlogPost);
router.post("/admin/changelog", requireAdmin, auditLog("create_changelog"), AdminRoutes.createChangelog);
router.put("/admin/changelog/:id", requireAdmin, auditLog("update_changelog"), AdminRoutes.updateChangelog);
router.delete("/admin/changelog/:id", requireAdmin, auditLog("delete_changelog"), AdminRoutes.deleteChangelog);

// ============================================
// DASHBOARD: everything below is scoped to the signed-in developer's apps
// ============================================

// Licenses across the developer's apps, shaped for the "Users" page.
router.get("/users", authenticateToken, async (req: Request, res: Response) => {
  const result = await pool.query(
    `SELECT
       l.license_key AS id,
       l.license_key AS username,
       l.expires_at,
       l.created_at,
       l.is_banned,
       (SELECT h.hwid_hash FROM hwid_slots h WHERE h.license_key = l.license_key
        ORDER BY h.last_seen DESC LIMIT 1) AS hwid
     FROM licenses l
     JOIN applications a ON l.app_id = a.app_id
     WHERE a.owner_email = $1
     ORDER BY l.created_at DESC
     LIMIT 100`,
    [ownerEmail(req)]
  );

  res.json(
    result.rows.map((row: any) => ({
      id: row.id,
      username: row.username,
      email: "",
      expires_at: row.expires_at,
      created_at: row.created_at,
      hwid_hash: row.hwid || "",
      status: row.is_banned ? "banned" : !row.expires_at || new Date(row.expires_at) > new Date() ? "active" : "expired",
    }))
  );
});

router.delete("/users/:id", authenticateToken, async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!(await userOwnsLicense(ownerEmail(req), id))) {
    return res.status(404).json({ message: "License not found" });
  }
  await deleteLicenses([id]);
  res.json({ message: "User deleted" });
});

router.get("/admin/applications", authenticateToken, async (req: Request, res: Response) => {
  const result = await pool.query(
    `SELECT a.app_id AS id, a.name, a.version, a.created_at,
       (SELECT COUNT(*) FROM licenses WHERE app_id = a.app_id) AS license_count
     FROM applications a
     WHERE a.owner_email = $1
     ORDER BY a.created_at DESC`,
    [ownerEmail(req)]
  );

  res.json(
    result.rows.map((app: any) => ({
      id: app.id,
      name: app.name || "Untitled application",
      version: app.version || "1.0.0",
      status: "active",
      users: Number.parseInt(app.license_count, 10) || 0,
      created: app.created_at,
    }))
  );
});

router.post("/admin/app/create", authenticateToken, async (req: Request, res: Response) => {
  const name = optionalText(req.body?.name, 100);
  const version = optionalText(req.body?.version, 32) || "1.0.0";
  if (!name) {
    return res.status(400).json({ message: "Application name is required" });
  }

  const appId = crypto.randomBytes(16).toString("hex");
  const appSecret = crypto.randomBytes(32).toString("hex");

  await pool.query(
    "INSERT INTO applications (app_id, app_secret, owner_email, name, version) VALUES ($1, $2, $3, $4, $5)",
    [appId, appSecret, ownerEmail(req), name, version]
  );

  res.status(201).json({ app_id: appId, app_secret: appSecret, name, version });
});

router.get("/admin/app/:app_id", authenticateToken, async (req: Request, res: Response) => {
  const result = await pool.query(
    `SELECT a.app_id, a.app_secret, a.name, a.version, a.created_at,
       (SELECT COUNT(*) FROM licenses WHERE app_id = a.app_id) AS license_count,
       (SELECT COUNT(*) FROM validation_logs WHERE app_id = a.app_id) AS validation_count
     FROM applications a
     WHERE a.app_id = $1 AND a.owner_email = $2`,
    [req.params.app_id, ownerEmail(req)]
  );
  const app = result.rows[0];
  if (!app) {
    return res.status(404).json({ message: "Application not found" });
  }

  res.json({
    id: app.app_id,
    name: app.name || "Untitled application",
    version: app.version || "1.0.0",
    status: "active",
    users: Number.parseInt(app.license_count, 10) || 0,
    validations: Number.parseInt(app.validation_count, 10) || 0,
    created: app.created_at,
    secret: app.app_secret,
  });
});

router.get("/admin/stats", authenticateToken, async (req: Request, res: Response) => {
  const email = ownerEmail(req);
  const apps = await pool.query("SELECT app_id FROM applications WHERE owner_email = $1", [email]);
  const appIds = apps.rows.map((row: any) => row.app_id);

  if (appIds.length === 0) {
    return res.json({
      totalLicenses: 0,
      activeLicenses: 0,
      totalHwidBindings: 0,
      expiringThisWeek: 0,
      totalApplications: 0,
      recentActivity: [],
    });
  }

  const [total, active, bindings, expiring, recent] = await Promise.all([
    pool.query("SELECT COUNT(*) FROM licenses WHERE app_id = ANY($1)", [appIds]),
    pool.query(
      "SELECT COUNT(*) FROM licenses WHERE app_id = ANY($1) AND (expires_at IS NULL OR expires_at > NOW()) AND is_banned = false",
      [appIds]
    ),
    pool.query(
      "SELECT COUNT(*) FROM hwid_slots hs JOIN licenses l ON hs.license_key = l.license_key WHERE l.app_id = ANY($1)",
      [appIds]
    ),
    pool.query(
      `SELECT COUNT(*) FROM licenses WHERE app_id = ANY($1)
       AND expires_at > NOW() AND expires_at < NOW() + INTERVAL '7 days' AND is_banned = false`,
      [appIds]
    ),
    pool.query(
      `SELECT l.license_key, l.created_at, l.app_id, l.expires_at FROM licenses l
       WHERE l.app_id = ANY($1) ORDER BY l.created_at DESC LIMIT 10`,
      [appIds]
    ),
  ]);

  res.json({
    totalLicenses: Number.parseInt(total.rows[0].count, 10),
    activeLicenses: Number.parseInt(active.rows[0].count, 10),
    totalHwidBindings: Number.parseInt(bindings.rows[0].count, 10),
    expiringThisWeek: Number.parseInt(expiring.rows[0].count, 10),
    totalApplications: appIds.length,
    recentActivity: recent.rows,
  });
});

router.get("/admin/analytics", authenticateToken, async (req: Request, res: Response) => {
  const email = ownerEmail(req);
  const scoped = "app_id IN (SELECT app_id FROM applications WHERE owner_email = $1)";

  const [outcomes, hwids, licenses, active, byDay] = await Promise.all([
    pool.query(
      `SELECT COUNT(*) FILTER (WHERE result = 'success') AS ok, COUNT(*) FILTER (WHERE result <> 'success') AS failed
       FROM validation_logs WHERE ${scoped}`,
      [email]
    ),
    pool.query(
      `SELECT COUNT(DISTINCT hs.hwid_hash) AS count FROM hwid_slots hs
       JOIN licenses l ON hs.license_key = l.license_key WHERE l.${scoped}`,
      [email]
    ),
    pool.query(`SELECT COUNT(*) AS count FROM licenses WHERE ${scoped}`, [email]),
    pool.query(
      `SELECT COUNT(*) AS count FROM licenses WHERE ${scoped} AND (expires_at IS NULL OR expires_at > NOW()) AND is_banned = false`,
      [email]
    ),
    pool.query(
      `SELECT DATE(created_at) AS date,
         COUNT(*) FILTER (WHERE result = 'success') AS successful,
         COUNT(*) FILTER (WHERE result <> 'success') AS failed
       FROM validation_logs
       WHERE ${scoped} AND created_at >= NOW() - INTERVAL '7 days'
       GROUP BY DATE(created_at)
       ORDER BY date`,
      [email]
    ),
  ]);

  const ok = Number.parseInt(outcomes.rows[0].ok, 10);
  const failed = Number.parseInt(outcomes.rows[0].failed, 10);

  res.json({
    totalValidations: ok + failed,
    successRate: ok + failed === 0 ? 100 : Math.round((ok / (ok + failed)) * 1000) / 10,
    failedAttempts: failed,
    uniqueHwids: Number.parseInt(hwids.rows[0].count, 10),
    totalLicenses: Number.parseInt(licenses.rows[0].count, 10),
    activeLicenses: Number.parseInt(active.rows[0].count, 10),
    validationData: byDay.rows.map((row: any) => ({
      date: row.date,
      successful: Number.parseInt(row.successful, 10),
      failed: Number.parseInt(row.failed, 10),
    })),
  });
});

router.post("/admin/license/create", authenticateToken, async (req: Request, res: Response) => {
  const { app_id } = req.body ?? {};
  const email = ownerEmail(req);

  if (!(await userOwnsApp(email, app_id))) {
    return res.status(403).json({ message: "Application not found or access denied" });
  }

  const days = clampInt(req.body.days, 1, 3650, 30);
  const maxHwidSlots = clampInt(req.body.max_hwid_slots, 1, 100, 1);
  const licenseKey = generateLicenseKey();
  const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

  await pool.query(
    "INSERT INTO licenses (license_key, app_id, expires_at, max_hwid_slots, is_banned) VALUES ($1, $2, $3, $4, false)",
    [licenseKey, app_id, expiresAt, maxHwidSlots]
  );

  triggerWebhook(email, "license.created", {
    license_key: licenseKey,
    app_id,
    expires_at: expiresAt,
    max_hwid_slots: maxHwidSlots,
  }).catch((err) => logger.warn("Webhook trigger failed", { error: err.message }));

  res.status(201).json({ license_key: licenseKey, expires_at: expiresAt });
});

router.get("/admin/licenses", authenticateToken, async (req: Request, res: Response) => {
  const result = await pool.query(
    `SELECT l.license_key, l.app_id, l.expires_at, l.max_hwid_slots, l.is_banned, l.created_at, l.notes,
       (SELECT COUNT(*) FROM hwid_slots WHERE license_key = l.license_key) AS hwid_count
     FROM licenses l
     JOIN applications a ON l.app_id = a.app_id
     WHERE a.owner_email = $1
     ORDER BY l.created_at DESC`,
    [ownerEmail(req)]
  );
  res.json(result.rows);
});

// Defined before /admin/licenses/:app_id so "export" isn't read as an app id.
router.get("/admin/licenses/export", authenticateToken, async (req: Request, res: Response) => {
  const result = await pool.query(
    `SELECT l.license_key, l.app_id, l.expires_at, l.max_hwid_slots, l.is_banned, l.created_at, l.notes,
       (SELECT COUNT(*) FROM hwid_slots WHERE license_key = l.license_key) AS hwid_count
     FROM licenses l
     JOIN applications a ON l.app_id = a.app_id
     WHERE a.owner_email = $1
     ORDER BY l.created_at DESC`,
    [ownerEmail(req)]
  );

  // Quote every cell, double embedded quotes, and neutralise leading
  // =, +, -, @ so a crafted note can't run as a spreadsheet formula.
  const cell = (value: unknown) => {
    let text = value === null || value === undefined ? "" : String(value);
    if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
    return `"${text.replace(/"/g, '""')}"`;
  };

  const header = ["License Key", "App ID", "Expires At", "Max HWID Slots", "Used Slots", "Status", "Created At", "Notes"];
  const rows = result.rows.map((row: any) => [
    row.license_key,
    row.app_id,
    row.expires_at ? new Date(row.expires_at).toISOString() : "",
    row.max_hwid_slots,
    row.hwid_count,
    row.is_banned ? "Banned" : !row.expires_at || new Date(row.expires_at) > new Date() ? "Active" : "Expired",
    new Date(row.created_at).toISOString(),
    row.notes,
  ]);

  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", "attachment; filename=licenses.csv");
  res.send([header, ...rows].map((row) => row.map(cell).join(",")).join("\n"));
});

router.get("/admin/licenses/:app_id", authenticateToken, async (req: Request, res: Response) => {
  const { app_id } = req.params;
  if (!(await userOwnsApp(ownerEmail(req), app_id))) {
    return res.status(404).json({ message: "Application not found" });
  }

  const result = await pool.query(
    `SELECT license_key, expires_at, max_hwid_slots, is_banned, created_at, notes
     FROM licenses WHERE app_id = $1 ORDER BY created_at DESC`,
    [app_id]
  );
  res.json(result.rows);
});

router.delete("/admin/license/:license_key", authenticateToken, async (req: Request, res: Response) => {
  const { license_key } = req.params;
  if (!(await userOwnsLicense(ownerEmail(req), license_key))) {
    return res.status(404).json({ message: "License not found" });
  }
  await deleteLicenses([license_key]);
  res.json({ message: "License deleted successfully" });
});

async function setLicenseBan(req: Request, res: Response, banned: boolean) {
  const { license_key } = req.body ?? {};
  if (!(await userOwnsLicense(ownerEmail(req), license_key))) {
    return res.status(404).json({ message: "License not found" });
  }
  await pool.query("UPDATE licenses SET is_banned = $1 WHERE license_key = $2", [banned, license_key]);
  if (banned) {
    // End running sessions so the ban reaches clients on their next heartbeat.
    await pool.query("DELETE FROM sessions WHERE license_key = $1", [license_key]);
  }
  res.json({ success: true });
}

router.post("/admin/license/ban", authenticateToken, (req: Request, res: Response) => setLicenseBan(req, res, true));
router.post("/admin/license/unban", authenticateToken, (req: Request, res: Response) => setLicenseBan(req, res, false));

router.post("/admin/licenses/bulk-action", authenticateToken, async (req: Request, res: Response) => {
  const { action, license_keys } = req.body ?? {};

  if (
    !Array.isArray(license_keys) ||
    license_keys.length === 0 ||
    license_keys.length > 500 ||
    !license_keys.every((key) => typeof key === "string")
  ) {
    return res.status(400).json({ message: "Invalid request" });
  }
  if (!["ban", "unban", "delete"].includes(action)) {
    return res.status(400).json({ message: "Invalid action" });
  }

  const owned = await pool.query(
    `SELECT DISTINCT l.license_key FROM licenses l JOIN applications a ON l.app_id = a.app_id
     WHERE a.owner_email = $1 AND l.license_key = ANY($2)`,
    [ownerEmail(req), license_keys]
  );
  if (owned.rows.length !== new Set(license_keys).size) {
    return res.status(403).json({ message: "Some licenses do not belong to you" });
  }

  let result;
  if (action === "delete") {
    result = await deleteLicenses(license_keys);
  } else {
    result = await pool.query("UPDATE licenses SET is_banned = $1 WHERE license_key = ANY($2)", [
      action === "ban",
      license_keys,
    ]);
    if (action === "ban") {
      await pool.query("DELETE FROM sessions WHERE license_key = ANY($1)", [license_keys]);
    }
  }

  res.json({ success: true, affected: result.rowCount || 0 });
});

router.put("/admin/license/:license_key/notes", authenticateToken, async (req: Request, res: Response) => {
  const { license_key } = req.params;
  if (!(await userOwnsLicense(ownerEmail(req), license_key))) {
    return res.status(404).json({ message: "License not found" });
  }
  await pool.query("UPDATE licenses SET notes = $1 WHERE license_key = $2", [
    optionalText(req.body?.notes, 2000),
    license_key,
  ]);
  res.json({ success: true });
});

router.get("/admin/license/:license_key/hwids", authenticateToken, async (req: Request, res: Response) => {
  const { license_key } = req.params;
  if (!(await userOwnsLicense(ownerEmail(req), license_key))) {
    return res.status(404).json({ message: "License not found" });
  }
  const result = await pool.query(
    `SELECT id, hwid_hash, device_name, last_seen, ip_address, unbind_count, last_unbind_at
     FROM hwid_slots WHERE license_key = $1 ORDER BY last_seen DESC`,
    [license_key]
  );
  res.json(result.rows);
});

router.delete("/admin/license/:license_key/hwid/:hwid_id", authenticateToken, async (req: Request, res: Response) => {
  const { license_key, hwid_id } = req.params;
  if (!(await userOwnsLicense(ownerEmail(req), license_key))) {
    return res.status(404).json({ message: "License not found" });
  }
  await pool.query("DELETE FROM hwid_slots WHERE license_key = $1 AND id = $2", [
    license_key,
    clampInt(hwid_id, 0, 2147483647, 0),
  ]);
  res.json({ success: true });
});

// --- License templates ---

router.get("/admin/templates", authenticateToken, async (req: Request, res: Response) => {
  const result = await pool.query(
    `SELECT template_id, name, days_valid, max_hwid_slots, metadata, created_at
     FROM license_templates WHERE owner_email = $1 ORDER BY created_at DESC`,
    [ownerEmail(req)]
  );
  res.json(result.rows);
});

router.post("/admin/templates", authenticateToken, async (req: Request, res: Response) => {
  const name = optionalText(req.body?.name, 100);
  if (!name) {
    return res.status(400).json({ message: "Template name is required" });
  }
  const metadata = req.body?.metadata && typeof req.body.metadata === "object" ? req.body.metadata : {};
  const templateId = crypto.randomBytes(16).toString("hex");

  await pool.query(
    `INSERT INTO license_templates (template_id, owner_email, name, days_valid, max_hwid_slots, metadata)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [
      templateId,
      ownerEmail(req),
      name,
      clampInt(req.body.days_valid, 1, 3650, 30),
      clampInt(req.body.max_hwid_slots, 1, 100, 1),
      metadata,
    ]
  );
  res.status(201).json({ template_id: templateId });
});

router.delete("/admin/templates/:template_id", authenticateToken, async (req: Request, res: Response) => {
  await pool.query("DELETE FROM license_templates WHERE template_id = $1 AND owner_email = $2", [
    req.params.template_id,
    ownerEmail(req),
  ]);
  res.json({ success: true });
});

// --- Validation logs and analytics ---

router.get("/admin/logs", authenticateToken, async (req: Request, res: Response) => {
  const { app_id, license_key, result } = req.query;
  const limit = clampInt(req.query.limit, 1, 500, 100);
  const offset = clampInt(req.query.offset, 0, 1_000_000, 0);

  const conditions = ["a.owner_email = $1"];
  const params: unknown[] = [ownerEmail(req)];
  for (const [column, value] of [
    ["vl.app_id", app_id],
    ["vl.license_key", license_key],
    ["vl.result", result],
  ] as const) {
    if (typeof value === "string" && value) {
      params.push(value);
      conditions.push(`${column} = $${params.length}`);
    }
  }
  const where = conditions.join(" AND ");

  const [logs, count] = await Promise.all([
    pool.query(
      `SELECT vl.id, vl.license_key, vl.app_id, vl.hwid_hash, vl.ip_address,
              vl.result, vl.error_message, vl.user_agent, vl.created_at
       FROM validation_logs vl JOIN applications a ON vl.app_id = a.app_id
       WHERE ${where}
       ORDER BY vl.created_at DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    ),
    pool.query(
      `SELECT COUNT(*) FROM validation_logs vl JOIN applications a ON vl.app_id = a.app_id WHERE ${where}`,
      params
    ),
  ]);

  res.json({
    logs: logs.rows,
    total: Number.parseInt(count.rows[0].count, 10),
    limit,
    offset,
  });
});

router.get("/admin/analytics/:app_id", authenticateToken, async (req: Request, res: Response) => {
  const { app_id } = req.params;
  if (!(await userOwnsApp(ownerEmail(req), app_id))) {
    return res.status(404).json({ message: "Application not found" });
  }

  const days = clampInt(req.query.days, 1, 365, 7);
  const window = "created_at >= NOW() - make_interval(days => $2)";

  const [byDay, successRate, geo, errors] = await Promise.all([
    pool.query(
      `SELECT DATE(created_at) AS date, result, COUNT(*) AS count FROM validation_logs
       WHERE app_id = $1 AND ${window} GROUP BY DATE(created_at), result ORDER BY date DESC`,
      [app_id, days]
    ),
    pool.query(
      `SELECT result, COUNT(*) AS count FROM validation_logs WHERE app_id = $1 AND ${window} GROUP BY result`,
      [app_id, days]
    ),
    pool.query(
      `SELECT country_code, COUNT(*) AS count FROM api_analytics
       WHERE app_id = $1 AND ${window} AND country_code IS NOT NULL
       GROUP BY country_code ORDER BY count DESC LIMIT 10`,
      [app_id, days]
    ),
    pool.query(
      `SELECT error_message, COUNT(*) AS count FROM validation_logs
       WHERE app_id = $1 AND result <> 'success' AND ${window}
       GROUP BY error_message ORDER BY count DESC LIMIT 10`,
      [app_id, days]
    ),
  ]);

  res.json({
    validationsByDay: byDay.rows,
    successRate: successRate.rows,
    geoDistribution: geo.rows,
    errorBreakdown: errors.rows,
  });
});

// --- Webhooks ---

const WEBHOOK_EVENTS = ["license.created", "license.validated", "license.expired", "license.banned"];

function validEvents(events: unknown): events is string[] {
  return (
    Array.isArray(events) &&
    events.length > 0 &&
    events.every((event) => typeof event === "string" && WEBHOOK_EVENTS.includes(event))
  );
}

router.get("/admin/webhooks", authenticateToken, async (req: Request, res: Response) => {
  const result = await pool.query(
    `SELECT webhook_id, url, events, is_active, created_at, updated_at
     FROM webhooks WHERE owner_email = $1 ORDER BY created_at DESC`,
    [ownerEmail(req)]
  );
  res.json(result.rows);
});

router.post("/admin/webhooks", authenticateToken, async (req: Request, res: Response) => {
  const { url, events } = req.body ?? {};
  if (!validEvents(events)) {
    return res.status(400).json({ message: `events must be a non-empty list of: ${WEBHOOK_EVENTS.join(", ")}` });
  }
  const urlProblem = await validateWebhookUrl(url);
  if (urlProblem) {
    return res.status(400).json({ message: urlProblem });
  }

  const webhookId = `wh_${crypto.randomBytes(12).toString("hex")}`;
  const secret = crypto.randomBytes(32).toString("hex");

  await pool.query(
    "INSERT INTO webhooks (webhook_id, owner_email, url, events, secret) VALUES ($1, $2, $3, $4, $5)",
    [webhookId, ownerEmail(req), url, events, secret]
  );

  // The signing secret is shown once, at creation.
  res.status(201).json({ webhook_id: webhookId, secret });
});

router.delete("/admin/webhooks/:webhook_id", authenticateToken, async (req: Request, res: Response) => {
  await pool.query("DELETE FROM webhook_deliveries WHERE webhook_id IN (SELECT webhook_id FROM webhooks WHERE webhook_id = $1 AND owner_email = $2)", [
    req.params.webhook_id,
    ownerEmail(req),
  ]);
  await pool.query("DELETE FROM webhooks WHERE webhook_id = $1 AND owner_email = $2", [
    req.params.webhook_id,
    ownerEmail(req),
  ]);
  res.json({ success: true });
});

router.put("/admin/webhooks/:webhook_id", authenticateToken, async (req: Request, res: Response) => {
  const { url, events, is_active } = req.body ?? {};

  if (url !== undefined) {
    const urlProblem = await validateWebhookUrl(url);
    if (urlProblem) return res.status(400).json({ message: urlProblem });
  }
  if (events !== undefined && !validEvents(events)) {
    return res.status(400).json({ message: `events must be a non-empty list of: ${WEBHOOK_EVENTS.join(", ")}` });
  }

  await pool.query(
    `UPDATE webhooks
     SET url = COALESCE($1, url), events = COALESCE($2, events), is_active = COALESCE($3, is_active), updated_at = NOW()
     WHERE webhook_id = $4 AND owner_email = $5`,
    [url ?? null, events ?? null, typeof is_active === "boolean" ? is_active : null, req.params.webhook_id, ownerEmail(req)]
  );
  res.json({ success: true });
});

router.get("/admin/webhooks/:webhook_id/deliveries", authenticateToken, async (req: Request, res: Response) => {
  const owned = await pool.query("SELECT 1 FROM webhooks WHERE webhook_id = $1 AND owner_email = $2", [
    req.params.webhook_id,
    ownerEmail(req),
  ]);
  if (owned.rows.length === 0) {
    return res.status(404).json({ message: "Webhook not found" });
  }

  const result = await pool.query(
    `SELECT id, event_type, payload, status_code, response_body, attempt_count, delivered_at, failed_at, created_at
     FROM webhook_deliveries WHERE webhook_id = $1 ORDER BY created_at DESC LIMIT 50`,
    [req.params.webhook_id]
  );
  res.json(result.rows);
});

router.post("/admin/webhooks/:webhook_id/test", authenticateToken, async (req: Request, res: Response) => {
  const result = await pool.query("SELECT url, secret FROM webhooks WHERE webhook_id = $1 AND owner_email = $2", [
    req.params.webhook_id,
    ownerEmail(req),
  ]);
  const webhook = result.rows[0];
  if (!webhook) {
    return res.status(404).json({ message: "Webhook not found" });
  }

  const payload = {
    event: "test",
    webhook_id: req.params.webhook_id,
    timestamp: new Date().toISOString(),
    data: { message: "This is a test webhook from ShieldAuth" },
  };

  try {
    const delivery = await sendWebhook(req.params.webhook_id, webhook.url, webhook.secret, payload);
    res.json({
      success: delivery.status >= 200 && delivery.status < 300,
      status_code: delivery.status,
      response_body: delivery.body.slice(0, 200),
    });
  } catch (err: any) {
    res.json({ success: false, error: err.message });
  }
});

// --- API keys ---

router.get("/admin/api-keys", authenticateToken, async (req: Request, res: Response) => {
  const result = await pool.query(
    `SELECT key_id, name, app_id, scopes, last_used_at, expires_at, created_at
     FROM api_keys WHERE owner_email = $1 ORDER BY created_at DESC`,
    [ownerEmail(req)]
  );
  res.json(result.rows);
});

router.post("/admin/api-keys", authenticateToken, async (req: Request, res: Response) => {
  const { app_id, scopes } = req.body ?? {};
  const name = optionalText(req.body?.name, 100);
  const email = ownerEmail(req);

  if (!name || !Array.isArray(scopes) || scopes.length === 0 || !scopes.every((s) => typeof s === "string")) {
    return res.status(400).json({ message: "Name and scopes are required" });
  }
  if (app_id && !(await userOwnsApp(email, app_id))) {
    return res.status(403).json({ message: "Application not found or access denied" });
  }

  const keyId = `sk_${crypto.randomBytes(12).toString("hex")}`;
  const apiKey = `${keyId}_${crypto.randomBytes(24).toString("hex")}`;
  // Keys are 192 bits of randomness, so a fast hash is enough here; only
  // the hash is stored.
  const keyHash = crypto.createHash("sha256").update(apiKey).digest("hex");
  const days = req.body.expires_in_days ? clampInt(req.body.expires_in_days, 1, 3650, 365) : null;
  const expiresAt = days ? new Date(Date.now() + days * 24 * 60 * 60 * 1000) : null;

  await pool.query(
    `INSERT INTO api_keys (key_id, key_hash, owner_email, app_id, name, scopes, expires_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [keyId, keyHash, email, app_id || null, name, scopes, expiresAt]
  );

  res.status(201).json({
    key_id: keyId,
    api_key: apiKey,
    message: "Save this key securely - it won't be shown again",
  });
});

router.delete("/admin/api-keys/:key_id", authenticateToken, async (req: Request, res: Response) => {
  await pool.query("DELETE FROM api_keys WHERE key_id = $1 AND owner_email = $2", [
    req.params.key_id,
    ownerEmail(req),
  ]);
  res.json({ success: true });
});

// --- Fraud alerts ---

router.get("/admin/fraud-alerts", authenticateToken, async (req: Request, res: Response) => {
  const { severity, is_resolved } = req.query;
  const params: unknown[] = [ownerEmail(req)];
  let query = `
    SELECT fa.id, fa.license_key, fa.alert_type, fa.severity, fa.details,
           fa.trust_score, fa.is_resolved, fa.auto_banned, fa.created_at
    FROM fraud_alerts fa
    JOIN licenses l ON fa.license_key = l.license_key
    JOIN applications a ON l.app_id = a.app_id
    WHERE a.owner_email = $1`;

  if (typeof severity === "string" && severity) {
    params.push(severity);
    query += ` AND fa.severity = $${params.length}`;
  }
  if (is_resolved !== undefined) {
    params.push(is_resolved === "true");
    query += ` AND fa.is_resolved = $${params.length}`;
  }

  const result = await pool.query(`${query} ORDER BY fa.created_at DESC LIMIT 100`, params);
  res.json(result.rows);
});

router.put("/admin/fraud-alerts/:alert_id/resolve", authenticateToken, async (req: Request, res: Response) => {
  const result = await pool.query(
    `UPDATE fraud_alerts SET is_resolved = TRUE
     WHERE id = $1 AND license_key IN (
       SELECT l.license_key FROM licenses l JOIN applications a ON l.app_id = a.app_id WHERE a.owner_email = $2
     )`,
    [clampInt(req.params.alert_id, 0, 2147483647, 0), ownerEmail(req)]
  );
  if (result.rowCount === 0) {
    return res.status(404).json({ message: "Alert not found" });
  }
  res.json({ success: true });
});

// ============================================
// PUBLIC: CUSTOMER LICENSE PORTAL
// The license key itself is the credential here (128 random bits).
// ============================================

router.get("/public/portal/:license_key", async (req: Request, res: Response) => {
  const { license_key } = req.params;

  const licenseResult = await pool.query(
    "SELECT license_key, expires_at, max_hwid_slots, is_banned FROM licenses WHERE license_key = $1",
    [license_key]
  );
  const license = licenseResult.rows[0];
  if (!license) {
    return res.status(404).json({ message: "License not found" });
  }

  const [hwids, lastUnbind] = await Promise.all([
    pool.query(
      `SELECT id, hwid_hash, device_name, last_seen, unbind_count, last_unbind_at
       FROM hwid_slots WHERE license_key = $1 ORDER BY last_seen DESC`,
      [license_key]
    ),
    pool.query(
      `SELECT MAX(created_at) AS last FROM portal_actions
       WHERE license_key = $1 AND action_type = 'unbind' AND created_at > NOW() - INTERVAL '7 days'`,
      [license_key]
    ),
  ]);

  const expiresAt = license.expires_at ? new Date(license.expires_at) : null;
  const canUnbind = !lastUnbind.rows[0].last;

  res.json({
    license_key: license.license_key,
    expires_at: license.expires_at,
    days_remaining: expiresAt ? Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null,
    max_hwid_slots: license.max_hwid_slots,
    is_banned: license.is_banned,
    is_active: !license.is_banned && (!expiresAt || expiresAt > new Date()),
    hwid_bindings: hwids.rows.map((row: any) => ({
      id: row.id,
      hwid_hash: row.hwid_hash.substring(0, 16) + "...",
      device_name: row.device_name || "Unknown Device",
      last_seen: row.last_seen,
      unbind_count: row.unbind_count,
      last_unbind_at: row.last_unbind_at,
      can_unbind: canUnbind,
    })),
  });
});

// Self-service unbind, at most once a week per license.
router.post(
  "/public/portal/:license_key/unbind/:hwid_id",
  publicWriteLimiter,
  async (req: Request, res: Response) => {
    const { license_key } = req.params;
    const hwidId = clampInt(req.params.hwid_id, 0, 2147483647, 0);

    const slot = await pool.query("SELECT id, hwid_hash FROM hwid_slots WHERE id = $1 AND license_key = $2", [
      hwidId,
      license_key,
    ]);
    if (slot.rows.length === 0) {
      return res.status(404).json({ message: "HWID binding not found" });
    }

    // The slot row is deleted on unbind, so the weekly limit is tracked in
    // portal_actions rather than on the slot itself.
    const recent = await pool.query(
      `SELECT MAX(created_at) AS last FROM portal_actions
       WHERE license_key = $1 AND action_type = 'unbind' AND created_at > NOW() - INTERVAL '7 days'`,
      [license_key]
    );
    if (recent.rows[0].last) {
      const daysSince = (Date.now() - new Date(recent.rows[0].last).getTime()) / (1000 * 60 * 60 * 24);
      return res.status(429).json({
        message: "You can only unbind once every 7 days",
        retry_after: Math.ceil(7 - daysSince),
      });
    }

    await pool.query("DELETE FROM hwid_slots WHERE id = $1", [hwidId]);
    await pool.query("DELETE FROM sessions WHERE license_key = $1 AND hwid_hash = $2", [
      license_key,
      slot.rows[0].hwid_hash,
    ]);
    await pool.query(
      "INSERT INTO portal_actions (license_key, action_type, hwid_hash, ip_address) VALUES ($1, 'unbind', $2, $3)",
      [license_key, slot.rows[0].hwid_hash, req.ip || ""]
    );

    res.json({ success: true, message: "Device unbound successfully" });
  }
);

router.put(
  "/public/portal/:license_key/device/:hwid_id/name",
  publicWriteLimiter,
  async (req: Request, res: Response) => {
    const deviceName = req.body?.device_name;
    if (typeof deviceName !== "string" || !deviceName.trim() || deviceName.length > 100) {
      return res.status(400).json({ message: "Invalid device name" });
    }

    const result = await pool.query("UPDATE hwid_slots SET device_name = $1 WHERE id = $2 AND license_key = $3", [
      deviceName.trim(),
      clampInt(req.params.hwid_id, 0, 2147483647, 0),
      req.params.license_key,
    ]);
    if (result.rowCount === 0) {
      return res.status(404).json({ message: "HWID binding not found" });
    }
    res.json({ success: true });
  }
);

// Landing-page counters. Aggregates only.
router.get("/public/stats", async (_req: Request, res: Response) => {
  const [today, total, active] = await Promise.all([
    pool.query("SELECT COUNT(*) FROM validation_logs WHERE created_at >= CURRENT_DATE"),
    pool.query("SELECT COUNT(*) FROM licenses"),
    pool.query("SELECT COUNT(*) FROM licenses WHERE (expires_at IS NULL OR expires_at > NOW()) AND is_banned = FALSE"),
  ]);
  res.json({
    validations_today: Number.parseInt(today.rows[0].count, 10),
    total_licenses: Number.parseInt(total.rows[0].count, 10),
    active_licenses: Number.parseInt(active.rows[0].count, 10),
  });
});

// ============================================
// PUBLIC SITE CONTENT
// ============================================

router.get("/public/blog", async (req: Request, res: Response) => {
  const { category, featured } = req.query;
  const limit = clampInt(req.query.limit, 1, 50, 10);
  const offset = clampInt(req.query.offset, 0, 10000, 0);

  const params: unknown[] = [];
  let query = `
    SELECT post_id, title, slug, excerpt, featured_emoji, category,
           read_time_minutes, published_at, views, likes
    FROM blog_posts WHERE is_published = true`;

  if (typeof category === "string" && category) {
    params.push(category);
    query += ` AND category = $${params.length}`;
  }
  if (featured === "true") {
    query += " AND is_featured = true";
  }

  const result = await pool.query(
    `${query} ORDER BY published_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, limit, offset]
  );
  const count = await pool.query("SELECT COUNT(*) FROM blog_posts WHERE is_published = true");

  res.json({ posts: result.rows, total: Number.parseInt(count.rows[0].count, 10), limit, offset });
});

router.get("/public/blog/:slug", async (req: Request, res: Response) => {
  const result = await pool.query(
    `UPDATE blog_posts SET views = views + 1 WHERE slug = $1 AND is_published = true
     RETURNING post_id, title, slug, excerpt, content, featured_emoji, category, read_time_minutes,
               published_at, updated_at, views, likes`,
    [req.params.slug]
  );
  if (result.rows.length === 0) {
    return res.status(404).json({ message: "Blog post not found" });
  }
  res.json(result.rows[0]);
});

router.post("/public/blog/:slug/like", publicWriteLimiter, async (req: Request, res: Response) => {
  await pool.query("UPDATE blog_posts SET likes = likes + 1 WHERE slug = $1 AND is_published = true", [
    req.params.slug,
  ]);
  res.json({ success: true });
});

router.get("/public/changelog", async (_req: Request, res: Response) => {
  const entries = await pool.query(
    "SELECT * FROM changelog_entries WHERE is_published = true ORDER BY release_date DESC"
  );

  const result = await Promise.all(
    entries.rows.map(async (entry: any) => {
      const changes = await pool.query(
        "SELECT change_type, description FROM changelog_changes WHERE entry_id = $1 ORDER BY sort_order, change_id",
        [entry.entry_id]
      );
      const grouped: Record<string, string[]> = { new: [], improved: [], fixed: [], deprecated: [], security: [] };
      for (const change of changes.rows) {
        grouped[change.change_type]?.push(change.description);
      }
      return { entry_id: entry.entry_id, version: entry.version, date: entry.release_date, changes: grouped };
    })
  );

  res.json(result);
});

router.get("/public/status", async (_req: Request, res: Response) => {
  const monitors = await pool.query(
    `SELECT m.*,
       (SELECT status FROM service_status_logs WHERE monitor_id = m.monitor_id ORDER BY checked_at DESC LIMIT 1) AS current_status,
       (SELECT response_time_ms FROM service_status_logs WHERE monitor_id = m.monitor_id ORDER BY checked_at DESC LIMIT 1) AS last_response_time
     FROM service_monitors m WHERE is_active = true`
  );

  const services = await Promise.all(
    monitors.rows.map(async (monitor: any) => {
      const uptime = await pool.query(
        `SELECT COUNT(*) AS total_checks, COUNT(*) FILTER (WHERE status = 'operational') AS operational_checks
         FROM service_status_logs WHERE monitor_id = $1 AND checked_at > NOW() - INTERVAL '30 days'`,
        [monitor.monitor_id]
      );
      const total = Number.parseInt(uptime.rows[0].total_checks, 10);
      const operational = Number.parseInt(uptime.rows[0].operational_checks, 10);
      return {
        name: monitor.service_name,
        description: monitor.service_description,
        status: monitor.current_status || "operational",
        uptime: `${total > 0 ? ((operational / total) * 100).toFixed(2) : "100.00"}%`,
        response_time_ms: monitor.last_response_time,
      };
    })
  );

  const incidents = await pool.query(
    `SELECT i.*, m.service_name FROM status_incidents i
     JOIN service_monitors m ON i.monitor_id = m.monitor_id
     WHERE i.resolved_at IS NULL ORDER BY i.started_at DESC`
  );

  res.json({
    overall_status: services.every((s) => s.status === "operational") ? "operational" : "degraded",
    services,
    active_incidents: incidents.rows,
  });
});

router.get("/public/status/incidents", async (req: Request, res: Response) => {
  const result = await pool.query(
    `SELECT i.*, m.service_name,
       (SELECT json_agg(json_build_object('message', message, 'status', status, 'posted_at', posted_at) ORDER BY posted_at DESC)
        FROM incident_updates WHERE incident_id = i.incident_id) AS updates
     FROM status_incidents i
     JOIN service_monitors m ON i.monitor_id = m.monitor_id
     ORDER BY i.started_at DESC
     LIMIT $1`,
    [clampInt(req.query.limit, 1, 50, 10)]
  );
  res.json(result.rows);
});

router.post("/admin/status/incident", requireAdmin, auditLog("create_incident"), async (req: Request, res: Response) => {
  const { monitor_id, title, description, severity } = req.body ?? {};
  const result = await pool.query(
    `INSERT INTO status_incidents (monitor_id, title, description, severity, started_at)
     VALUES ($1, $2, $3, $4, NOW()) RETURNING *`,
    [monitor_id, optionalText(title, 255), optionalText(description, 5000), severity]
  );
  res.status(201).json(result.rows[0]);
});

router.post(
  "/admin/status/incident/:incident_id/update",
  requireAdmin,
  auditLog("update_incident"),
  async (req: Request, res: Response) => {
    const { message, status } = req.body ?? {};
    await pool.query("INSERT INTO incident_updates (incident_id, message, status) VALUES ($1, $2, $3)", [
      req.params.incident_id,
      optionalText(message, 5000),
      status,
    ]);
    await pool.query(
      `UPDATE status_incidents
       SET status = $1, resolved_at = CASE WHEN $1 = 'resolved' THEN NOW() ELSE resolved_at END
       WHERE incident_id = $2`,
      [status, req.params.incident_id]
    );
    res.json({ success: true });
  }
);

router.get("/public/testimonials", async (req: Request, res: Response) => {
  let query = "SELECT * FROM testimonials WHERE is_approved = true";
  if (req.query.featured === "true") {
    query += " AND is_featured = true";
  }
  const result = await pool.query(`${query} ORDER BY display_order, testimonial_id DESC LIMIT $1`, [
    clampInt(req.query.limit, 1, 50, 20),
  ]);
  res.json(result.rows);
});

router.post("/admin/testimonials", requireAdmin, auditLog("create_testimonial"), async (req: Request, res: Response) => {
  const { author_name, author_role, author_company, author_avatar_url, quote, rating, is_featured } = req.body ?? {};
  const result = await pool.query(
    `INSERT INTO testimonials (author_name, author_role, author_company, author_avatar_url,
       quote, rating, is_featured, is_approved, approved_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, true, NOW()) RETURNING *`,
    [author_name, author_role, author_company, author_avatar_url, quote, clampInt(rating, 1, 5, 5), Boolean(is_featured)]
  );
  res.status(201).json(result.rows[0]);
});

router.get("/public/faqs", async (req: Request, res: Response) => {
  const params: unknown[] = [];
  let query = "SELECT * FROM faqs WHERE is_published = true";
  if (typeof req.query.category === "string" && req.query.category) {
    params.push(req.query.category);
    query += " AND category = $1";
  }
  params.push(clampInt(req.query.limit, 1, 100, 50));
  const result = await pool.query(`${query} ORDER BY display_order, faq_id LIMIT $${params.length}`, params);
  res.json(result.rows);
});

router.post("/public/faqs/:faq_id/helpful", publicWriteLimiter, async (req: Request, res: Response) => {
  // Column name comes from a fixed pair, never from user input.
  const column = req.body?.helpful ? "helpful_yes" : "helpful_no";
  await pool.query(`UPDATE faqs SET ${column} = ${column} + 1, views = views + 1 WHERE faq_id = $1`, [
    clampInt(req.params.faq_id, 0, 2147483647, 0),
  ]);
  res.json({ success: true });
});

router.post("/admin/faqs", requireAdmin, auditLog("create_faq"), async (req: Request, res: Response) => {
  const { question, answer, category, display_order } = req.body ?? {};
  const result = await pool.query(
    "INSERT INTO faqs (question, answer, category, display_order) VALUES ($1, $2, $3, $4) RETURNING *",
    [question, answer, category, clampInt(display_order, 0, 1000, 0)]
  );
  res.status(201).json(result.rows[0]);
});

// ============================================
// SUPPORT TICKETS (signed-in users, own tickets only)
// ============================================

router.get("/support/tickets", authenticateToken, async (req: Request, res: Response) => {
  const result = await pool.query(
    `SELECT t.*, (SELECT COUNT(*) FROM ticket_messages WHERE ticket_id = t.ticket_id) AS message_count
     FROM support_tickets t WHERE user_email = $1 ORDER BY created_at DESC`,
    [ownerEmail(req)]
  );
  res.json(result.rows);
});

router.get("/support/tickets/:ticket_number", authenticateToken, async (req: Request, res: Response) => {
  const ticket = await pool.query("SELECT * FROM support_tickets WHERE ticket_number = $1 AND user_email = $2", [
    req.params.ticket_number,
    ownerEmail(req),
  ]);
  if (ticket.rows.length === 0) {
    return res.status(404).json({ message: "Ticket not found" });
  }
  const messages = await pool.query(
    "SELECT * FROM ticket_messages WHERE ticket_id = $1 AND is_internal_note = false ORDER BY created_at",
    [ticket.rows[0].ticket_id]
  );
  res.json({ ticket: ticket.rows[0], messages: messages.rows });
});

router.post("/support/tickets", authenticateToken, async (req: Request, res: Response) => {
  const { priority, category } = req.body ?? {};
  const subject = optionalText(req.body?.subject, 255);
  const message = optionalText(req.body?.message, 10000);
  if (!subject || !message) {
    return res.status(400).json({ message: "Subject and message are required" });
  }

  // Random suffix rather than COUNT(*)+1, which collides under concurrency.
  const ticketNumber = `TKT-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
  const ticket = await pool.query(
    `INSERT INTO support_tickets (ticket_number, user_email, subject, priority, category)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [
      ticketNumber,
      ownerEmail(req),
      subject,
      ["low", "medium", "high", "urgent"].includes(priority) ? priority : "medium",
      optionalText(category, 50),
    ]
  );
  await pool.query("INSERT INTO ticket_messages (ticket_id, sender_email, message) VALUES ($1, $2, $3)", [
    ticket.rows[0].ticket_id,
    ownerEmail(req),
    message,
  ]);
  res.status(201).json(ticket.rows[0]);
});

router.post("/support/tickets/:ticket_number/messages", authenticateToken, async (req: Request, res: Response) => {
  const message = optionalText(req.body?.message, 10000);
  if (!message) {
    return res.status(400).json({ message: "Message is required" });
  }
  const ticket = await pool.query("SELECT ticket_id FROM support_tickets WHERE ticket_number = $1 AND user_email = $2", [
    req.params.ticket_number,
    ownerEmail(req),
  ]);
  if (ticket.rows.length === 0) {
    return res.status(404).json({ message: "Ticket not found" });
  }

  const ticketId = ticket.rows[0].ticket_id;
  await pool.query("INSERT INTO ticket_messages (ticket_id, sender_email, message) VALUES ($1, $2, $3)", [
    ticketId,
    ownerEmail(req),
    message,
  ]);
  await pool.query(
    "UPDATE support_tickets SET updated_at = NOW(), last_customer_reply_at = NOW(), status = 'open' WHERE ticket_id = $1",
    [ticketId]
  );
  res.json({ success: true });
});

// ============================================
// CONTACT FORM
// ============================================

router.post("/public/contact", publicWriteLimiter, async (req: Request, res: Response) => {
  const name = optionalText(req.body?.name, 255);
  const email = optionalText(req.body?.email, 255);
  const subject = optionalText(req.body?.subject, 255);
  const message = optionalText(req.body?.message, 5000);

  if (!name || !email || !EMAIL_PATTERN.test(email) || !message) {
    return res.status(400).json({ message: "Name, a valid email and a message are required" });
  }

  await pool.query(
    `INSERT INTO contact_submissions (name, email, subject, message, ip_address, user_agent)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [name, email, subject, message, req.ip || "", (req.get("user-agent") || "").slice(0, 500)]
  );

  res.json({ success: true, message: "Thanks for getting in touch." });
});

// Contact submissions contain visitors' personal details: admins only.
router.get("/admin/contact", requireAdmin, async (req: Request, res: Response) => {
  const params: unknown[] = [];
  let query = "SELECT * FROM contact_submissions WHERE is_spam = false";
  if (req.query.is_read !== undefined) {
    params.push(req.query.is_read === "true");
    query += ` AND is_read = $${params.length}`;
  }
  const result = await pool.query(
    `${query} ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, clampInt(req.query.limit, 1, 200, 50), clampInt(req.query.offset, 0, 100000, 0)]
  );
  res.json(result.rows);
});

router.get("/public/about/milestones", async (_req: Request, res: Response) => {
  const result = await pool.query(
    "SELECT * FROM company_milestones WHERE is_published = true ORDER BY year DESC, month DESC, display_order"
  );
  res.json(result.rows);
});

export default router;
