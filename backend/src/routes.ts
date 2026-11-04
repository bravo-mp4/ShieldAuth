import { Router, Request, Response } from "express";
import crypto from "crypto";
import {
  createUser,
  getUserByEmail,
  getUserById,
  verifyPassword,
  pool,
  PASSWORD_MIN_LENGTH,
  PASSWORD_MAX_BYTES,
} from "./database";
import { authenticateToken, requireAdmin, signToken } from "./middleware/auth";
import {
  auditLog,
  authLimiter,
  emailLimiter,
  licenseValidationLimiter,
  publicWriteLimiter,
} from "./middleware/security";
import { heartbeat, validateInputError, validateLicense } from "./license";
import { requestPasswordReset, resetPassword, sendVerificationEmail, setPassword, verifyEmail } from "./account";
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

function publicUser(user: any) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    email_verified: Boolean(user.email_verified_at),
  };
}

/** Returns a message if the password breaks the rules, otherwise null. */
function passwordProblem(password: unknown): string | null {
  if (typeof password !== "string" || password.length < PASSWORD_MIN_LENGTH) {
    return `Password must be at least ${PASSWORD_MIN_LENGTH} characters`;
  }
  if (Buffer.byteLength(password, "utf8") > PASSWORD_MAX_BYTES) {
    return `Password must be at most ${PASSWORD_MAX_BYTES} bytes`;
  }
  return null;
}

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

  return res.json({ token: signToken(user), user: publicUser(user) });
});

router.post("/auth/register", authLimiter, async (req: Request, res: Response) => {
  const { email, password, name } = req.body ?? {};

  if (typeof email !== "string" || typeof password !== "string" || !email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }
  if (email.length > 255 || !EMAIL_PATTERN.test(email)) {
    return res.status(400).json({ message: "Invalid email format" });
  }
  const problem = passwordProblem(password);
  if (problem) {
    return res.status(400).json({ message: problem });
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

  // A failed email shouldn't fail sign-up; the user can resend from Settings.
  await sendVerificationEmail(user).catch((err) => logger.warn("Verification email failed", { error: err.message }));

  return res.status(201).json({ token: signToken(user), user: publicUser(user) });
});

// Tokens are stateless; the client discards its copy. Bans and deletions
// still take effect at once because authenticateToken re-reads the user.
router.post("/auth/logout", authenticateToken, (_req: Request, res: Response) => {
  res.json({ message: "Logged out successfully" });
});

router.get("/auth/me", authenticateToken, async (req: Request, res: Response) => {
  res.json({ user: publicUser(await getUserById(req.user!.id)) });
});

// Same answer whether or not the email has an account.
router.post("/auth/forgot-password", emailLimiter, async (req: Request, res: Response) => {
  const { email } = req.body ?? {};
  if (typeof email === "string" && email.length <= 255 && EMAIL_PATTERN.test(email)) {
    await requestPasswordReset(email);
  }
  res.json({ message: "If that email has an account, a reset link is on its way." });
});

router.post("/auth/reset-password", authLimiter, async (req: Request, res: Response) => {
  const { token, password } = req.body ?? {};
  const problem = passwordProblem(password);
  if (problem) {
    return res.status(400).json({ message: problem });
  }
  if (!(await resetPassword(token, password))) {
    return res.status(400).json({ message: "This reset link is invalid or has expired" });
  }
  res.json({ message: "Password updated. Sign in with your new password." });
});

router.post("/auth/change-password", authenticateToken, authLimiter, async (req: Request, res: Response) => {
  const { current_password, new_password } = req.body ?? {};
  const problem = passwordProblem(new_password);
  if (problem) {
    return res.status(400).json({ message: problem });
  }

  const user = await getUserById(req.user!.id);
  if (typeof current_password !== "string" || !(await verifyPassword(current_password, user.password_hash))) {
    return res.status(400).json({ message: "Current password is incorrect" });
  }

  // Every other session is signed out; this one gets a fresh token.
  const updated = await setPassword(user.id, new_password);
  res.json({ token: signToken(updated), message: "Password changed" });
});

router.post("/auth/verify-email", authLimiter, async (req: Request, res: Response) => {
  if (!(await verifyEmail(req.body?.token))) {
    return res.status(400).json({ message: "This verification link is invalid or has expired" });
  }
  res.json({ message: "Email confirmed" });
});

router.post("/auth/resend-verification", authenticateToken, emailLimiter, async (req: Request, res: Response) => {
  const user = await getUserById(req.user!.id);
  if (user.email_verified_at) {
    return res.json({ message: "Email already confirmed" });
  }
  await sendVerificationEmail(user);
  res.json({ message: "Verification email sent" });
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

  await pool.query(
    "INSERT INTO applications (app_id, owner_email, name, version) VALUES ($1, $2, $3, $4)",
    [appId, ownerEmail(req), name, version]
  );

  res.status(201).json({ app_id: appId, name, version });
});

router.get("/admin/app/:app_id", authenticateToken, async (req: Request, res: Response) => {
  const result = await pool.query(
    `SELECT a.app_id, a.name, a.version, a.created_at,
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
    `SELECT id, hwid_hash, device_name, last_seen, ip_address
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

  const [byDay, successRate, errors] = await Promise.all([
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
      `SELECT error_message, COUNT(*) AS count FROM validation_logs
       WHERE app_id = $1 AND result <> 'success' AND ${window}
       GROUP BY error_message ORDER BY count DESC LIMIT 10`,
      [app_id, days]
    ),
  ]);

  res.json({
    validationsByDay: byDay.rows,
    successRate: successRate.rows,
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
      `SELECT id, hwid_hash, device_name, last_seen
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

export default router;
