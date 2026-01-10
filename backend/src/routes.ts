import { Router, Request, Response } from "express";
import { ValidateRequest, ValidateResponse } from "./types";
import {
  getLicense,
  getHWIDs,
  bindHWID,
  createSession,
  createUser,
  getUserByEmail,
  verifyPassword,
  pool,
} from "./database";
import crypto from "crypto";
import jwt from "jsonwebtoken";

const router = Router();
const JWT_SECRET =
  process.env.JWT_SECRET || "your-secret-key-change-in-production";

// Authentication middleware
const authenticateToken = (req: Request, res: Response, next: any) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Access token required" });
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
      return res.status(403).json({ message: "Invalid or expired token" });
    }
    (req as any).user = user;
    next();
  });
};

// Auth: Login (using database)
router.post("/auth/login", async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  try {
    console.log(`Login attempt for: ${email}`);

    const user = await getUserByEmail(email);

    if (!user) {
      console.log(`User not found: ${email}`);
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isValid = await verifyPassword(password, user.password_hash);

    if (!isValid) {
      console.log(`Invalid password for: ${email}`);
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    console.log(`Login successful: ${email}`);
    return res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error: any) {
    console.error("Login error:", {
      message: error.message,
      code: error.code,
      stack: error.stack,
    });
    return res.status(500).json({
      message: "Database connection error. Please try again.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// Auth: Register
router.post("/auth/register", async (req: Request, res: Response) => {
  const { email, password, name } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: "Invalid email format" });
  }

  if (password.length < 6) {
    return res
      .status(400)
      .json({ message: "Password must be at least 6 characters" });
  }

  try {
    console.log(`Registration attempt: ${email}`);

    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      console.log(`User already exists: ${email}`);
      return res.status(409).json({ message: "User already exists" });
    }

    const user = await createUser(email, password, name);

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    return res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// Auth: Logout
router.post(
  "/auth/logout",
  authenticateToken,
  async (req: Request, res: Response) => {
    // In a real app, you might invalidate the token in a blacklist
    res.json({ message: "Logged out successfully" });
  }
);

router.post("/validate", async (req: Request, res: Response) => {
  const { app_id, license_key, hwid }: ValidateRequest = req.body;
  const ip_address = req.headers["x-forwarded-for"] as string || req.socket.remoteAddress || "";
  const user_agent = req.headers["user-agent"] || "";

  let result = "success";
  let error_message = "";

  try {
    // Get license
    const license = await getLicense(license_key);

    if (!license) {
      result = "invalid";
      error_message = "License not found";
      
      // Log validation attempt
      await pool.query(
        `INSERT INTO validation_logs (license_key, app_id, hwid_hash, ip_address, result, error_message, user_agent)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [license_key, app_id, hwid, ip_address, result, error_message, user_agent]
      );

      return res.json({ valid: false, message: "Invalid or expired license" });
    }

    if (license.is_banned) {
      result = "banned";
      error_message = "License is banned";
      
      await pool.query(
        `INSERT INTO validation_logs (license_key, app_id, hwid_hash, ip_address, result, error_message, user_agent)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [license_key, app_id, hwid, ip_address, result, error_message, user_agent]
      );

      return res.json({ valid: false, message: "Invalid or expired license" });
    }

    if (new Date(license.expires_at) < new Date()) {
      result = "expired";
      error_message = "License has expired";
      
      await pool.query(
        `INSERT INTO validation_logs (license_key, app_id, hwid_hash, ip_address, result, error_message, user_agent)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [license_key, app_id, hwid, ip_address, result, error_message, user_agent]
      );

      return res.json({ valid: false, message: "Invalid or expired license" });
    }

    // Check HWID
    const hwids = await getHWIDs(license_key);

    if (hwids.length === 0) {
      await bindHWID(license_key, hwid);
      // Update HWID slot with IP
      await pool.query(
        "UPDATE hwid_slots SET ip_address = $1, last_seen = NOW() WHERE license_key = $2 AND hwid_hash = $3",
        [ip_address, license_key, hwid]
      );
    } else if (!hwids.includes(hwid)) {
      if (hwids.length >= license.max_hwid_slots) {
        result = "hwid_limit";
        error_message = "HWID limit reached";
        
        await pool.query(
          `INSERT INTO validation_logs (license_key, app_id, hwid_hash, ip_address, result, error_message, user_agent)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [license_key, app_id, hwid, ip_address, result, error_message, user_agent]
        );

        return res.json({ valid: false, message: "HWID limit reached" });
      }
      await bindHWID(license_key, hwid);
      await pool.query(
        "UPDATE hwid_slots SET ip_address = $1, last_seen = NOW() WHERE license_key = $2 AND hwid_hash = $3",
        [ip_address, license_key, hwid]
      );
    } else {
      // Update last seen for existing HWID
      await pool.query(
        "UPDATE hwid_slots SET last_seen = NOW(), last_ip_address = ip_address, ip_address = $1 WHERE license_key = $2 AND hwid_hash = $3",
        [ip_address, license_key, hwid]
      );
    }

    // Create session
    const sessionId = crypto.randomBytes(32).toString("hex");
    await createSession(sessionId, license_key, hwid);

    // Log successful validation
    await pool.query(
      `INSERT INTO validation_logs (license_key, app_id, hwid_hash, ip_address, result, error_message, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [license_key, app_id, hwid, ip_address, "success", "", user_agent]
    );

    // Log API analytics
    await pool.query(
      `INSERT INTO api_analytics (app_id, endpoint, method, status_code, ip_address)
       VALUES ($1, $2, $3, $4, $5)`,
      [app_id, "/validate", "POST", 200, ip_address]
    );

    const response: ValidateResponse = {
      valid: true,
      message: "License validated",
      expires_at: new Date(license.expires_at).getTime() / 1000,
      session_id: sessionId,
    };

    res.json(response);
  } catch (error) {
    console.error("Validation error:", error);
    res.status(500).json({ valid: false, message: "Internal server error" });
  }
});

router.post("/heartbeat", async (req: Request, res: Response) => {
  const sessionId = req.headers["session-id"] as string;

  // Update last_heartbeat
  // TODO: implement

  res.json({ success: true });
});

export default router;

// Generate license key
function generateLicenseKey(): string {
  return crypto.randomBytes(16).toString("hex").toUpperCase();
}

// Applications endpoints (protected)
router.get(
  "/applications",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const result = await pool.query(
        "SELECT app_id as id, owner_email, created_at FROM applications ORDER BY created_at DESC"
      );

      // Map to frontend format
      const apps = result.rows.map((app: any) => ({
        id: app.id,
        name: `App ${app.id.substring(0, 8)}`,
        version: "1.0.0",
        status: "active",
        users: Math.floor(Math.random() * 1000), // TODO: Get actual count
        created: app.created_at.toISOString().split("T")[0],
      }));

      res.json(apps);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch applications" });
    }
  }
);

router.post(
  "/applications",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const { name, version } = req.body;
      const appId = crypto.randomBytes(16).toString("hex");
      const appSecret = crypto.randomBytes(32).toString("hex");
      const userEmail = (req as any).user.email;

      await pool.query(
        "INSERT INTO applications (app_id, app_secret, owner_email) VALUES ($1, $2, $3)",
        [appId, appSecret, userEmail]
      );

      res.json({
        id: appId,
        name,
        version,
        status: "active",
        users: 0,
        created: new Date().toISOString().split("T")[0],
      });
    } catch (err) {
      res.status(500).json({ message: "Failed to create application" });
    }
  }
);

// Users endpoints (protected)
router.get("/users", authenticateToken, async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT 
        l.license_key as id,
        l.license_key as username,
        l.expires_at,
        l.created_at,
        l.is_banned,
        (
          SELECT h.hwid_hash 
          FROM hwid_slots h 
          WHERE h.license_key = l.license_key 
          ORDER BY h.last_seen DESC 
          LIMIT 1
        ) as hwid
      FROM licenses l
      ORDER BY l.created_at DESC
      LIMIT 100
    `);

    const users = result.rows.map((user: any) => ({
      id: user.id,
      username: user.username,
      email: "",
      expires_at: user.expires_at,
      created_at: user.created_at,
      hwid_hash: user.hwid || "",
      status: user.is_banned
        ? "banned"
        : new Date(user.expires_at) > new Date()
        ? "active"
        : "expired",
    }));

    res.json(users);
  } catch (err) {
    console.error("Failed to fetch users:", err);
    res.status(500).json({ message: "Failed to fetch users" });
  }
});

router.delete(
  "/users/:id",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await pool.query("DELETE FROM licenses WHERE license_key = $1", [id]);
      res.json({ message: "User deleted" });
    } catch (err) {
      res.status(500).json({ message: "Failed to delete user" });
    }
  }
);

// Applications endpoints (protected)
router.get(
  "/admin/applications",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const userEmail = (req as any).user.email;
      console.log("[/admin/applications] Fetching apps for user:", userEmail);
      
      const result = await pool.query(`
      SELECT 
        app_id as id,
        owner_email,
        created_at,
        (SELECT COUNT(*) FROM licenses WHERE app_id = a.app_id) as license_count
      FROM applications a
      WHERE owner_email = $1
      ORDER BY created_at DESC
    `, [userEmail]);

      console.log("[/admin/applications] Found", result.rows.length, "applications");
      console.log("[/admin/applications] Raw data:", result.rows);

      const apps = result.rows.map((app: any) => ({
        id: app.id,
        name: app.owner_email || "Application",
        version: "1.0.0",
        status: "active",
        users: parseInt(app.license_count) || 0,
        created: app.created_at,
        validation_count: 0,
      }));

      console.log("[/admin/applications] Returning:", apps);
      res.json(apps);
    } catch (err) {
      console.error("Failed to fetch applications:", err);
      res.status(500).json({ message: "Failed to fetch applications" });
    }
  }
);

// Logs endpoints (protected)
router.get("/logs", authenticateToken, async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT 
        s.session_id as id,
        s.last_heartbeat as timestamp,
        'auth' as type,
        'License validation' as message,
        l.license_key as username,
        '' as ip
      FROM sessions s
      JOIN licenses l ON s.license_key = l.license_key
      ORDER BY s.last_heartbeat DESC
      LIMIT 100
    `);

    res.json(result.rows);
  } catch (err) {
    console.error("Failed to fetch logs:", err);
    res.status(500).json({ message: "Failed to fetch logs" });
  }
});

// Alias for admin logs
router.get(
  "/admin/logs",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const result = await pool.query(`
      SELECT 
        s.session_id as id,
        s.last_heartbeat as timestamp,
        'auth' as type,
        'License validation' as message,
        l.license_key as username,
        '' as ip
      FROM sessions s
      JOIN licenses l ON s.license_key = l.license_key
      ORDER BY s.last_heartbeat DESC
      LIMIT 100
    `);

      res.json(result.rows);
    } catch (err) {
      console.error("Failed to fetch logs:", err);
      res.status(500).json({ message: "Failed to fetch logs" });
    }
  }
);

// Analytics endpoint
router.get(
  "/admin/analytics",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      // Get total validations (sessions)
      const totalValidations = await pool.query(
        "SELECT COUNT(*) as count FROM sessions"
      );

      // Get unique HWIDs
      const uniqueHwids = await pool.query(
        "SELECT COUNT(DISTINCT hwid_hash) as count FROM hwid_slots"
      );

      // Get total licenses
      const totalLicenses = await pool.query(
        "SELECT COUNT(*) as count FROM licenses"
      );

      // Get active licenses (not expired)
      const activeLicenses = await pool.query(
        "SELECT COUNT(*) as count FROM licenses WHERE expires_at > NOW()"
      );

      // Get recent validations by day (last 7 days)
      const validationsByDay = await pool.query(`
      SELECT 
        DATE(last_heartbeat) as date,
        COUNT(*) as successful,
        0 as failed
      FROM sessions
      WHERE last_heartbeat >= NOW() - INTERVAL '7 days'
      GROUP BY DATE(last_heartbeat)
      ORDER BY date DESC
      LIMIT 7
    `);

      res.json({
        totalValidations: parseInt(totalValidations.rows[0].count),
        successRate: 100, // No failed tracking yet
        failedAttempts: 0,
        uniqueHwids: parseInt(uniqueHwids.rows[0].count),
        totalLicenses: parseInt(totalLicenses.rows[0].count),
        activeLicenses: parseInt(activeLicenses.rows[0].count),
        validationData: validationsByDay.rows.reverse(),
      });
    } catch (err) {
      console.error("Failed to fetch analytics:", err);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  }
);

// Admin: Create application
router.post("/admin/app/create", authenticateToken, async (req: Request, res: Response) => {
  try {
    const { name, version } = req.body;
    const userEmail = (req as any).user.email;

    const appId = crypto.randomBytes(16).toString("hex");
    const appSecret = crypto.randomBytes(32).toString("hex");

    await pool.query(
      "INSERT INTO applications (app_id, app_secret, owner_email) VALUES ($1, $2, $3)",
      [appId, appSecret, userEmail]
    );

    res.json({ 
      app_id: appId, 
      app_secret: appSecret,
      name,
      version 
    });
  } catch (err) {
    console.error("Failed to create application:", err);
    res.status(500).json({ message: "Failed to create application" });
  }
});

// Admin: Get dashboard statistics
router.get("/admin/stats", authenticateToken, async (req: Request, res: Response) => {
  try {
    const userEmail = (req as any).user.email;
    console.log("[/admin/stats] Fetching stats for user:", userEmail);

    // Get user's app IDs
    const appsResult = await pool.query(
      "SELECT app_id FROM applications WHERE owner_email = $1",
      [userEmail]
    );
    const appIds = appsResult.rows.map((row: any) => row.app_id);

    if (appIds.length === 0) {
      return res.json({
        totalLicenses: 0,
        activeLicenses: 0,
        totalHwidBindings: 0,
        expiringThisWeek: 0,
        totalApplications: 0,
        recentActivity: []
      });
    }

    // Total licenses
    const totalLicensesResult = await pool.query(
      "SELECT COUNT(*) FROM licenses WHERE app_id = ANY($1)",
      [appIds]
    );

    // Active licenses (not expired and not banned)
    const activeLicensesResult = await pool.query(
      "SELECT COUNT(*) FROM licenses WHERE app_id = ANY($1) AND expires_at > NOW() AND is_banned = false",
      [appIds]
    );

    // Total HWID bindings
    const hwidBindingsResult = await pool.query(
      `SELECT COUNT(*) FROM hwid_slots hs 
       JOIN licenses l ON hs.license_key = l.license_key 
       WHERE l.app_id = ANY($1)`,
      [appIds]
    );

    // Licenses expiring in next 7 days
    const expiringResult = await pool.query(
      `SELECT COUNT(*) FROM licenses 
       WHERE app_id = ANY($1) 
       AND expires_at > NOW() 
       AND expires_at < NOW() + INTERVAL '7 days'
       AND is_banned = false`,
      [appIds]
    );

    // Recent activity (last 10 created licenses)
    const recentActivityResult = await pool.query(
      `SELECT l.license_key, l.created_at, a.app_id, l.expires_at
       FROM licenses l
       JOIN applications a ON l.app_id = a.app_id
       WHERE a.owner_email = $1
       ORDER BY l.created_at DESC
       LIMIT 10`,
      [userEmail]
    );

    res.json({
      totalLicenses: parseInt(totalLicensesResult.rows[0].count),
      activeLicenses: parseInt(activeLicensesResult.rows[0].count),
      totalHwidBindings: parseInt(hwidBindingsResult.rows[0].count),
      expiringThisWeek: parseInt(expiringResult.rows[0].count),
      totalApplications: appIds.length,
      recentActivity: recentActivityResult.rows
    });
  } catch (err) {
    console.error("[/admin/stats] Error:", err);
    res.status(500).json({ message: "Failed to fetch stats", error: String(err) });
  }
});

// Admin: Get all applications for user
router.get("/admin/applications", authenticateToken, async (req: Request, res: Response) => {
  try {
    const userEmail = (req as any).user.email;
    console.log("[/admin/applications] Fetching applications for user:", userEmail);
    
    const result = await pool.query(
      `SELECT app_id as id, app_id, app_secret, owner_email, created_at
       FROM applications
       WHERE owner_email = $1
       ORDER BY created_at DESC`,
      [userEmail]
    );

    console.log("[/admin/applications] Found", result.rows.length, "applications");
    res.json(result.rows);
  } catch (err) {
    console.error("[/admin/applications] Error fetching applications:", err);
    res.status(500).json({ message: "Failed to fetch applications", error: String(err) });
  }
});

// Admin: Generate license
router.post("/admin/license/create", authenticateToken, async (req: Request, res: Response) => {
  try {
    const { app_id, days, max_hwid_slots } = req.body;
    const userEmail = (req as any).user.email;

    // Verify the app belongs to the user
    const appCheck = await pool.query(
      "SELECT app_id FROM applications WHERE app_id = $1 AND owner_email = $2",
      [app_id, userEmail]
    );

    if (appCheck.rows.length === 0) {
      return res.status(403).json({ message: "Application not found or access denied" });
    }

    const licenseKey = generateLicenseKey();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + (days || 30));

    await pool.query(
      "INSERT INTO licenses (license_key, app_id, expires_at, max_hwid_slots, is_banned) VALUES ($1, $2, $3, $4, false)",
      [licenseKey, app_id, expiresAt, max_hwid_slots || 1]
    );

    // Trigger webhook
    triggerWebhook(userEmail, "license.created", {
      license_key: licenseKey,
      app_id,
      expires_at: expiresAt,
      max_hwid_slots: max_hwid_slots || 1
    }).catch(err => console.error("Webhook trigger failed:", err));

    res.json({ license_key: licenseKey, expires_at: expiresAt });
  } catch (err) {
    console.error("Failed to create license:", err);
    res.status(500).json({ message: "Failed to create license" });
  }
});

// Admin: List all licenses
router.get("/admin/licenses", authenticateToken, async (req: Request, res: Response) => {
  try {
    const userEmail = (req as any).user.email;
    console.log("[/admin/licenses] Fetching licenses for user:", userEmail);
    
    const result = await pool.query(
      `SELECT 
        l.license_key,
        l.app_id,
        l.expires_at,
        l.max_hwid_slots,
        l.is_banned,
        l.created_at,
        (SELECT COUNT(*) FROM hwid_slots WHERE license_key = l.license_key) as hwid_count,
        a.owner_email as app_owner
       FROM licenses l
       JOIN applications a ON l.app_id = a.app_id
       WHERE a.owner_email = $1
       ORDER BY l.created_at DESC`,
      [userEmail]
    );

    console.log("[/admin/licenses] Found", result.rows.length, "licenses");
    res.json(result.rows);
  } catch (err) {
    console.error("[/admin/licenses] Error fetching licenses:", err);
    res.status(500).json({ message: "Failed to fetch licenses", error: String(err) });
  }
});

// Admin: List licenses for app
router.get("/admin/licenses/:app_id", authenticateToken, async (req: Request, res: Response) => {
  try {
    const { app_id } = req.params;

    const result = await pool.query(
      "SELECT license_key, username, email, hwid, expires_at, is_active, created_at FROM licenses WHERE app_id = $1 ORDER BY created_at DESC",
      [app_id]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("Failed to fetch licenses:", err);
    res.status(500).json({ message: "Failed to fetch licenses" });
  }
});

// Admin: Delete license
router.delete("/admin/license/:license_key", authenticateToken, async (req: Request, res: Response) => {
  try {
    const { license_key } = req.params;

    await pool.query("DELETE FROM licenses WHERE license_key = $1", [license_key]);

    res.json({ message: "License deleted successfully" });
  } catch (err) {
    console.error("Failed to delete license:", err);
    res.status(500).json({ message: "Failed to delete license" });
  }
});

// Admin: Ban license
router.post("/admin/license/ban", authenticateToken, async (req: Request, res: Response) => {
  const { license_key } = req.body;

  await pool.query(
    "UPDATE licenses SET is_banned = TRUE WHERE license_key = $1",
    [license_key]
  );

  res.json({ success: true });
});

// Admin: Unban license
router.post("/admin/license/unban", authenticateToken, async (req: Request, res: Response) => {
  try {
    const { license_key } = req.body;

    await pool.query(
      "UPDATE licenses SET is_banned = FALSE WHERE license_key = $1",
      [license_key]
    );

    res.json({ success: true });
  } catch (err) {
    console.error("Failed to unban license:", err);
    res.status(500).json({ message: "Failed to unban license" });
  }
});

// Admin: Bulk license actions
router.post("/admin/licenses/bulk-action", authenticateToken, async (req: Request, res: Response) => {
  try {
    const { action, license_keys } = req.body;
    const userEmail = (req as any).user.email;

    if (!action || !Array.isArray(license_keys) || license_keys.length === 0) {
      return res.status(400).json({ message: "Invalid request" });
    }

    // Verify all licenses belong to user
    const verifyResult = await pool.query(
      `SELECT l.license_key FROM licenses l
       JOIN applications a ON l.app_id = a.app_id
       WHERE a.owner_email = $1 AND l.license_key = ANY($2)`,
      [userEmail, license_keys]
    );

    if (verifyResult.rows.length !== license_keys.length) {
      return res.status(403).json({ message: "Some licenses do not belong to you" });
    }

    let result;
    switch (action) {
      case "ban":
        result = await pool.query(
          "UPDATE licenses SET is_banned = TRUE WHERE license_key = ANY($1)",
          [license_keys]
        );
        break;
      case "unban":
        result = await pool.query(
          "UPDATE licenses SET is_banned = FALSE WHERE license_key = ANY($1)",
          [license_keys]
        );
        break;
      case "delete":
        // Delete associated HWID slots first
        await pool.query("DELETE FROM hwid_slots WHERE license_key = ANY($1)", [license_keys]);
        // Delete sessions
        await pool.query("DELETE FROM sessions WHERE license_key = ANY($1)", [license_keys]);
        // Delete licenses
        result = await pool.query("DELETE FROM licenses WHERE license_key = ANY($1)", [license_keys]);
        break;
      default:
        return res.status(400).json({ message: "Invalid action" });
    }

    res.json({ success: true, affected: result?.rowCount || 0 });
  } catch (err) {
    console.error("Failed to perform bulk action:", err);
    res.status(500).json({ message: "Failed to perform bulk action" });
  }
});

// Admin: Update license notes
router.put("/admin/license/:license_key/notes", authenticateToken, async (req: Request, res: Response) => {
  try {
    const { license_key } = req.params;
    const { notes } = req.body;
    const userEmail = (req as any).user.email;

    // Verify license belongs to user
    const verifyResult = await pool.query(
      `SELECT l.license_key FROM licenses l
       JOIN applications a ON l.app_id = a.app_id
       WHERE a.owner_email = $1 AND l.license_key = $2`,
      [userEmail, license_key]
    );

    if (verifyResult.rows.length === 0) {
      return res.status(403).json({ message: "License not found or access denied" });
    }

    await pool.query(
      "UPDATE licenses SET notes = $1 WHERE license_key = $2",
      [notes, license_key]
    );

    res.json({ success: true });
  } catch (err) {
    console.error("Failed to update notes:", err);
    res.status(500).json({ message: "Failed to update notes" });
  }
});

// Admin: Get HWID bindings for a license
router.get("/admin/license/:license_key/hwids", authenticateToken, async (req: Request, res: Response) => {
  try {
    const { license_key } = req.params;
    const userEmail = (req as any).user.email;

    // Verify license belongs to user
    const verifyResult = await pool.query(
      `SELECT l.license_key FROM licenses l
       JOIN applications a ON l.app_id = a.app_id
       WHERE a.owner_email = $1 AND l.license_key = $2`,
      [userEmail, license_key]
    );

    if (verifyResult.rows.length === 0) {
      return res.status(403).json({ message: "License not found or access denied" });
    }

    const result = await pool.query(
      `SELECT id, hwid_hash, device_name, last_seen, ip_address, unbind_count, last_unbind_at
       FROM hwid_slots
       WHERE license_key = $1
       ORDER BY last_seen DESC`,
      [license_key]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("Failed to fetch HWIDs:", err);
    res.status(500).json({ message: "Failed to fetch HWIDs" });
  }
});

// Admin: Unbind HWID from license
router.delete("/admin/license/:license_key/hwid/:hwid_id", authenticateToken, async (req: Request, res: Response) => {
  try {
    const { license_key, hwid_id } = req.params;
    const userEmail = (req as any).user.email;

    // Verify license belongs to user
    const verifyResult = await pool.query(
      `SELECT l.license_key FROM licenses l
       JOIN applications a ON l.app_id = a.app_id
       WHERE a.owner_email = $1 AND l.license_key = $2`,
      [userEmail, license_key]
    );

    if (verifyResult.rows.length === 0) {
      return res.status(403).json({ message: "License not found or access denied" });
    }

    await pool.query(
      "DELETE FROM hwid_slots WHERE license_key = $1 AND id = $2",
      [license_key, hwid_id]
    );

    res.json({ success: true });
  } catch (err) {
    console.error("Failed to unbind HWID:", err);
    res.status(500).json({ message: "Failed to unbind HWID" });
  }
});

// Admin: License templates
router.get("/admin/templates", authenticateToken, async (req: Request, res: Response) => {
  try {
    const userEmail = (req as any).user.email;

    const result = await pool.query(
      `SELECT template_id, name, days_valid, max_hwid_slots, metadata, created_at
       FROM license_templates
       WHERE owner_email = $1
       ORDER BY created_at DESC`,
      [userEmail]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("Failed to fetch templates:", err);
    res.status(500).json({ message: "Failed to fetch templates" });
  }
});

router.post("/admin/templates", authenticateToken, async (req: Request, res: Response) => {
  try {
    const { name, days_valid, max_hwid_slots, metadata } = req.body;
    const userEmail = (req as any).user.email;

    const templateId = crypto.randomBytes(16).toString("hex");

    await pool.query(
      `INSERT INTO license_templates (template_id, owner_email, name, days_valid, max_hwid_slots, metadata)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [templateId, userEmail, name, days_valid, max_hwid_slots || 1, metadata || {}]
    );

    res.json({ template_id: templateId });
  } catch (err) {
    console.error("Failed to create template:", err);
    res.status(500).json({ message: "Failed to create template" });
  }
});

router.delete("/admin/templates/:template_id", authenticateToken, async (req: Request, res: Response) => {
  try {
    const { template_id } = req.params;
    const userEmail = (req as any).user.email;

    await pool.query(
      "DELETE FROM license_templates WHERE template_id = $1 AND owner_email = $2",
      [template_id, userEmail]
    );

    res.json({ success: true });
  } catch (err) {
    console.error("Failed to delete template:", err);
    res.status(500).json({ message: "Failed to delete template" });
  }
});

// Admin: Export licenses to CSV
router.get("/admin/licenses/export", authenticateToken, async (req: Request, res: Response) => {
  try {
    const userEmail = (req as any).user.email;

    const result = await pool.query(
      `SELECT 
        l.license_key,
        l.app_id,
        l.expires_at,
        l.max_hwid_slots,
        l.is_banned,
        l.created_at,
        l.notes,
        (SELECT COUNT(*) FROM hwid_slots WHERE license_key = l.license_key) as hwid_count
       FROM licenses l
       JOIN applications a ON l.app_id = a.app_id
       WHERE a.owner_email = $1
       ORDER BY l.created_at DESC`,
      [userEmail]
    );

    // Generate CSV
    const headers = ["License Key", "App ID", "Expires At", "Max HWID Slots", "Used Slots", "Status", "Created At", "Notes"];
    const rows = result.rows.map((row) => [
      row.license_key,
      row.app_id,
      new Date(row.expires_at).toISOString(),
      row.max_hwid_slots,
      row.hwid_count,
      row.is_banned ? "Banned" : new Date(row.expires_at) > new Date() ? "Active" : "Expired",
      new Date(row.created_at).toISOString(),
      row.notes || ""
    ]);

    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=licenses.csv");
    res.send(csv);
  } catch (err) {
    console.error("Failed to export licenses:", err);
    res.status(500).json({ message: "Failed to export licenses" });
  }
});

// Admin: Validation logs
router.get("/admin/logs", authenticateToken, async (req: Request, res: Response) => {
  try {
    const userEmail = (req as any).user.email;
    const { app_id, license_key, result, limit = 100, offset = 0 } = req.query;

    let query = `
      SELECT vl.id, vl.license_key, vl.app_id, vl.hwid_hash, vl.ip_address, 
             vl.result, vl.error_message, vl.user_agent, vl.created_at
      FROM validation_logs vl
      JOIN applications a ON vl.app_id = a.app_id
      WHERE a.owner_email = $1
    `;
    const params: any[] = [userEmail];
    let paramIndex = 2;

    if (app_id) {
      query += ` AND vl.app_id = $${paramIndex}`;
      params.push(app_id);
      paramIndex++;
    }

    if (license_key) {
      query += ` AND vl.license_key = $${paramIndex}`;
      params.push(license_key);
      paramIndex++;
    }

    if (result) {
      query += ` AND vl.result = $${paramIndex}`;
      params.push(result);
      paramIndex++;
    }

    query += ` ORDER BY vl.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(parseInt(limit as string), parseInt(offset as string));

    const logsResult = await pool.query(query, params);

    // Get total count
    let countQuery = `
      SELECT COUNT(*) FROM validation_logs vl
      JOIN applications a ON vl.app_id = a.app_id
      WHERE a.owner_email = $1
    `;
    const countParams: any[] = [userEmail];
    let countParamIndex = 2;

    if (app_id) {
      countQuery += ` AND vl.app_id = $${countParamIndex}`;
      countParams.push(app_id);
      countParamIndex++;
    }

    if (license_key) {
      countQuery += ` AND vl.license_key = $${countParamIndex}`;
      countParams.push(license_key);
      countParamIndex++;
    }

    if (result) {
      countQuery += ` AND vl.result = $${countParamIndex}`;
      countParams.push(result);
    }

    const countResult = await pool.query(countQuery, countParams);

    res.json({
      logs: logsResult.rows,
      total: parseInt(countResult.rows[0].count),
      limit: parseInt(limit as string),
      offset: parseInt(offset as string)
    });
  } catch (err) {
    console.error("Failed to fetch logs:", err);
    res.status(500).json({ message: "Failed to fetch logs" });
  }
});

// Admin: Analytics per app
router.get("/admin/analytics/:app_id", authenticateToken, async (req: Request, res: Response) => {
  try {
    const { app_id } = req.params;
    const userEmail = (req as any).user.email;
    const { days = 7 } = req.query;

    // Verify app belongs to user
    const appCheck = await pool.query(
      "SELECT app_id FROM applications WHERE app_id = $1 AND owner_email = $2",
      [app_id, userEmail]
    );

    if (appCheck.rows.length === 0) {
      return res.status(403).json({ message: "Application not found or access denied" });
    }

    // Validation attempts over time
    const validationsByDay = await pool.query(
      `SELECT 
        DATE(created_at) as date,
        result,
        COUNT(*) as count
       FROM validation_logs
       WHERE app_id = $1 AND created_at >= NOW() - INTERVAL '${parseInt(days as string)} days'
       GROUP BY DATE(created_at), result
       ORDER BY date DESC`,
      [app_id]
    );

    // Success/failure rates
    const successRate = await pool.query(
      `SELECT 
        result,
        COUNT(*) as count
       FROM validation_logs
       WHERE app_id = $1 AND created_at >= NOW() - INTERVAL '${parseInt(days as string)} days'
       GROUP BY result`,
      [app_id]
    );

    // Geographic distribution (top countries)
    const geoDistribution = await pool.query(
      `SELECT 
        country_code,
        COUNT(*) as count
       FROM api_analytics
       WHERE app_id = $1 AND created_at >= NOW() - INTERVAL '${parseInt(days as string)} days' AND country_code IS NOT NULL
       GROUP BY country_code
       ORDER BY count DESC
       LIMIT 10`,
      [app_id]
    );

    // Error breakdown
    const errorBreakdown = await pool.query(
      `SELECT 
        error_message,
        COUNT(*) as count
       FROM validation_logs
       WHERE app_id = $1 AND result != 'success' AND created_at >= NOW() - INTERVAL '${parseInt(days as string)} days'
       GROUP BY error_message
       ORDER BY count DESC
       LIMIT 10`,
      [app_id]
    );

    res.json({
      validationsByDay: validationsByDay.rows,
      successRate: successRate.rows,
      geoDistribution: geoDistribution.rows,
      errorBreakdown: errorBreakdown.rows
    });
  } catch (err) {
    console.error("Failed to fetch app analytics:", err);
    res.status(500).json({ message: "Failed to fetch app analytics" });
  }
});

// Admin: Webhooks
router.get("/admin/webhooks", authenticateToken, async (req: Request, res: Response) => {
  try {
    const userEmail = (req as any).user.email;

    const result = await pool.query(
      `SELECT webhook_id, url, events, secret, is_active, created_at, updated_at
       FROM webhooks
       WHERE owner_email = $1
       ORDER BY created_at DESC`,
      [userEmail]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("Failed to fetch webhooks:", err);
    res.status(500).json({ message: "Failed to fetch webhooks" });
  }
});

router.post("/admin/webhooks", authenticateToken, async (req: Request, res: Response) => {
  try {
    const { url, events } = req.body;
    const userEmail = (req as any).user.email;

    if (!url || !Array.isArray(events) || events.length === 0) {
      return res.status(400).json({ message: "URL and events are required" });
    }

    const webhookId = `wh_${crypto.randomBytes(12).toString("hex")}`;
    const secret = crypto.randomBytes(32).toString("hex");

    await pool.query(
      `INSERT INTO webhooks (webhook_id, owner_email, url, events, secret)
       VALUES ($1, $2, $3, $4, $5)`,
      [webhookId, userEmail, url, events, secret]
    );

    res.json({ webhook_id: webhookId, secret });
  } catch (err) {
    console.error("Failed to create webhook:", err);
    res.status(500).json({ message: "Failed to create webhook" });
  }
});

router.delete("/admin/webhooks/:webhook_id", authenticateToken, async (req: Request, res: Response) => {
  try {
    const { webhook_id } = req.params;
    const userEmail = (req as any).user.email;

    await pool.query(
      "DELETE FROM webhooks WHERE webhook_id = $1 AND owner_email = $2",
      [webhook_id, userEmail]
    );

    res.json({ success: true });
  } catch (err) {
    console.error("Failed to delete webhook:", err);
    res.status(500).json({ message: "Failed to delete webhook" });
  }
});

router.put("/admin/webhooks/:webhook_id", authenticateToken, async (req: Request, res: Response) => {
  try {
    const { webhook_id } = req.params;
    const { url, events, is_active } = req.body;
    const userEmail = (req as any).user.email;

    await pool.query(
      `UPDATE webhooks 
       SET url = COALESCE($1, url), 
           events = COALESCE($2, events), 
           is_active = COALESCE($3, is_active),
           updated_at = NOW()
       WHERE webhook_id = $4 AND owner_email = $5`,
      [url, events, is_active, webhook_id, userEmail]
    );

    res.json({ success: true });
  } catch (err) {
    console.error("Failed to update webhook:", err);
    res.status(500).json({ message: "Failed to update webhook" });
  }
});

// Admin: Webhook deliveries (logs)
router.get("/admin/webhooks/:webhook_id/deliveries", authenticateToken, async (req: Request, res: Response) => {
  try {
    const { webhook_id } = req.params;
    const userEmail = (req as any).user.email;

    // Verify webhook belongs to user
    const webhookCheck = await pool.query(
      "SELECT webhook_id FROM webhooks WHERE webhook_id = $1 AND owner_email = $2",
      [webhook_id, userEmail]
    );

    if (webhookCheck.rows.length === 0) {
      return res.status(403).json({ message: "Webhook not found or access denied" });
    }

    const result = await pool.query(
      `SELECT id, event_type, payload, status_code, response_body, attempt_count, 
              delivered_at, failed_at, created_at
       FROM webhook_deliveries
       WHERE webhook_id = $1
       ORDER BY created_at DESC
       LIMIT 50`,
      [webhook_id]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("Failed to fetch webhook deliveries:", err);
    res.status(500).json({ message: "Failed to fetch webhook deliveries" });
  }
});

// Admin: Test webhook
router.post("/admin/webhooks/:webhook_id/test", authenticateToken, async (req: Request, res: Response) => {
  try {
    const { webhook_id } = req.params;
    const userEmail = (req as any).user.email;

    // Get webhook
    const webhookResult = await pool.query(
      "SELECT url, secret FROM webhooks WHERE webhook_id = $1 AND owner_email = $2",
      [webhook_id, userEmail]
    );

    if (webhookResult.rows.length === 0) {
      return res.status(403).json({ message: "Webhook not found or access denied" });
    }

    const webhook = webhookResult.rows[0];

    // Send test payload
    const testPayload = {
      event: "test",
      webhook_id,
      timestamp: new Date().toISOString(),
      data: { message: "This is a test webhook from ShieldAuth" }
    };

    try {
      const response = await fetch(webhook.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Webhook-Secret": webhook.secret
        },
        body: JSON.stringify(testPayload)
      });

      const responseBody = await response.text();

      res.json({
        success: response.ok,
        status_code: response.status,
        response_body: responseBody
      });
    } catch (fetchErr: any) {
      res.json({
        success: false,
        error: fetchErr.message
      });
    }
  } catch (err) {
    console.error("Failed to test webhook:", err);
    res.status(500).json({ message: "Failed to test webhook" });
  }
});

// Admin: API Keys
router.get("/admin/api-keys", authenticateToken, async (req: Request, res: Response) => {
  try {
    const userEmail = (req as any).user.email;

    const result = await pool.query(
      `SELECT key_id, name, app_id, scopes, last_used_at, expires_at, created_at
       FROM api_keys
       WHERE owner_email = $1
       ORDER BY created_at DESC`,
      [userEmail]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("Failed to fetch API keys:", err);
    res.status(500).json({ message: "Failed to fetch API keys" });
  }
});

router.post("/admin/api-keys", authenticateToken, async (req: Request, res: Response) => {
  try {
    const { name, app_id, scopes, expires_in_days } = req.body;
    const userEmail = (req as any).user.email;

    if (!name || !Array.isArray(scopes) || scopes.length === 0) {
      return res.status(400).json({ message: "Name and scopes are required" });
    }

    // Verify app belongs to user if app_id provided
    if (app_id) {
      const appCheck = await pool.query(
        "SELECT app_id FROM applications WHERE app_id = $1 AND owner_email = $2",
        [app_id, userEmail]
      );

      if (appCheck.rows.length === 0) {
        return res.status(403).json({ message: "Application not found or access denied" });
      }
    }

    const keyId = `sk_${crypto.randomBytes(12).toString("hex")}`;
    const apiKey = `${keyId}_${crypto.randomBytes(24).toString("hex")}`;
    const keyHash = crypto.createHash("sha256").update(apiKey).digest("hex");

    const expiresAt = expires_in_days ? new Date(Date.now() + expires_in_days * 24 * 60 * 60 * 1000) : null;

    await pool.query(
      `INSERT INTO api_keys (key_id, key_hash, owner_email, app_id, name, scopes, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [keyId, keyHash, userEmail, app_id, name, scopes, expiresAt]
    );

    res.json({ key_id: keyId, api_key: apiKey, message: "Save this key securely - it won't be shown again" });
  } catch (err) {
    console.error("Failed to create API key:", err);
    res.status(500).json({ message: "Failed to create API key" });
  }
});

router.delete("/admin/api-keys/:key_id", authenticateToken, async (req: Request, res: Response) => {
  try {
    const { key_id } = req.params;
    const userEmail = (req as any).user.email;

    await pool.query(
      "DELETE FROM api_keys WHERE key_id = $1 AND owner_email = $2",
      [key_id, userEmail]
    );

    res.json({ success: true });
  } catch (err) {
    console.error("Failed to delete API key:", err);
    res.status(500).json({ message: "Failed to delete API key" });
  }
});

// Admin: Fraud alerts
router.get("/admin/fraud-alerts", authenticateToken, async (req: Request, res: Response) => {
  try {
    const userEmail = (req as any).user.email;
    const { severity, is_resolved } = req.query;

    let query = `
      SELECT fa.id, fa.license_key, fa.alert_type, fa.severity, fa.details, 
             fa.trust_score, fa.is_resolved, fa.auto_banned, fa.created_at
      FROM fraud_alerts fa
      JOIN licenses l ON fa.license_key = l.license_key
      JOIN applications a ON l.app_id = a.app_id
      WHERE a.owner_email = $1
    `;
    const params: any[] = [userEmail];
    let paramIndex = 2;

    if (severity) {
      query += ` AND fa.severity = $${paramIndex}`;
      params.push(severity);
      paramIndex++;
    }

    if (is_resolved !== undefined) {
      query += ` AND fa.is_resolved = $${paramIndex}`;
      params.push(is_resolved === 'true');
      paramIndex++;
    }

    query += ` ORDER BY fa.created_at DESC LIMIT 100`;

    const result = await pool.query(query, params);

    res.json(result.rows);
  } catch (err) {
    console.error("Failed to fetch fraud alerts:", err);
    res.status(500).json({ message: "Failed to fetch fraud alerts" });
  }
});

router.put("/admin/fraud-alerts/:alert_id/resolve", authenticateToken, async (req: Request, res: Response) => {
  try {
    const { alert_id } = req.params;
    const userEmail = (req as any).user.email;

    // Verify alert belongs to user's license
    const verifyResult = await pool.query(
      `SELECT fa.id FROM fraud_alerts fa
       JOIN licenses l ON fa.license_key = l.license_key
       JOIN applications a ON l.app_id = a.app_id
       WHERE fa.id = $1 AND a.owner_email = $2`,
      [alert_id, userEmail]
    );

    if (verifyResult.rows.length === 0) {
      return res.status(403).json({ message: "Alert not found or access denied" });
    }

    await pool.query(
      "UPDATE fraud_alerts SET is_resolved = TRUE WHERE id = $1",
      [alert_id]
    );

    res.json({ success: true });
  } catch (err) {
    console.error("Failed to resolve alert:", err);
    res.status(500).json({ message: "Failed to resolve alert" });
  }
});

// Helper: Trigger webhook
async function triggerWebhook(ownerEmail: string, eventType: string, payload: any) {
  try {
    // Get all active webhooks for this user that listen to this event
    const webhooksResult = await pool.query(
      `SELECT webhook_id, url, secret
       FROM webhooks
       WHERE owner_email = $1 AND is_active = TRUE AND $2 = ANY(events)`,
      [ownerEmail, eventType]
    );

    for (const webhook of webhooksResult.rows) {
      const webhookPayload = {
        event: eventType,
        webhook_id: webhook.webhook_id,
        timestamp: new Date().toISOString(),
        data: payload
      };

      // Insert delivery record
      await pool.query(
        `INSERT INTO webhook_deliveries (webhook_id, event_type, payload, next_retry_at)
         VALUES ($1, $2, $3, NOW())`,
        [webhook.webhook_id, eventType, webhookPayload]
      );

      // Attempt delivery (non-blocking)
      deliverWebhook(webhook.webhook_id, webhook.url, webhook.secret, webhookPayload).catch((err) => {
        console.error(`Webhook delivery failed for ${webhook.webhook_id}:`, err);
      });
    }
  } catch (err) {
    console.error("Error triggering webhooks:", err);
  }
}

async function deliverWebhook(webhookId: string, url: string, secret: string, payload: any) {
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Webhook-Secret": secret,
        "X-Webhook-ID": webhookId
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10000)
    });

    const responseBody = await response.text();

    // Update delivery record
    await pool.query(
      `UPDATE webhook_deliveries
       SET status_code = $1, response_body = $2, delivered_at = NOW()
       WHERE webhook_id = $3 AND event_type = $4 AND delivered_at IS NULL
       ORDER BY created_at DESC LIMIT 1`,
      [response.status, responseBody.substring(0, 1000), webhookId, payload.event]
    );
  } catch (err: any) {
    // Update delivery record as failed
    await pool.query(
      `UPDATE webhook_deliveries
       SET failed_at = NOW(), response_body = $1
       WHERE webhook_id = $2 AND event_type = $3 AND delivered_at IS NULL AND failed_at IS NULL
       ORDER BY created_at DESC LIMIT 1`,
      [err.message, webhookId, payload.event]
    );
  }
}

// Public: License portal (no auth required)
router.get("/public/portal/:license_key", async (req: Request, res: Response) => {
  try {
    const { license_key } = req.params;

    // Get license info
    const licenseResult = await pool.query(
      `SELECT l.license_key, l.app_id, l.expires_at, l.max_hwid_slots, l.is_banned, l.created_at,
              a.owner_email
       FROM licenses l
       JOIN applications a ON l.app_id = a.app_id
       WHERE l.license_key = $1`,
      [license_key]
    );

    if (licenseResult.rows.length === 0) {
      return res.status(404).json({ message: "License not found" });
    }

    const license = licenseResult.rows[0];

    // Get HWID bindings
    const hwidsResult = await pool.query(
      `SELECT id, hwid_hash, device_name, last_seen, unbind_count, last_unbind_at
       FROM hwid_slots
       WHERE license_key = $1
       ORDER BY last_seen DESC`,
      [license_key]
    );

    // Calculate expiration days
    const expiresAt = new Date(license.expires_at);
    const now = new Date();
    const daysRemaining = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    res.json({
      license_key: license.license_key,
      expires_at: license.expires_at,
      days_remaining: daysRemaining,
      max_hwid_slots: license.max_hwid_slots,
      is_banned: license.is_banned,
      is_active: !license.is_banned && expiresAt > now,
      hwid_bindings: hwidsResult.rows.map((row: any) => ({
        id: row.id,
        hwid_hash: row.hwid_hash.substring(0, 16) + "...",
        device_name: row.device_name || "Unknown Device",
        last_seen: row.last_seen,
        unbind_count: row.unbind_count,
        last_unbind_at: row.last_unbind_at,
        can_unbind: row.unbind_count === 0 || 
                   (row.last_unbind_at && new Date(row.last_unbind_at).getTime() < Date.now() - 7 * 24 * 60 * 60 * 1000)
      }))
    });
  } catch (err) {
    console.error("Failed to fetch portal data:", err);
    res.status(500).json({ message: "Failed to fetch license data" });
  }
});

// Public: Self-service unbind HWID (rate limited)
router.post("/public/portal/:license_key/unbind/:hwid_id", async (req: Request, res: Response) => {
  try {
    const { license_key, hwid_id } = req.params;
    const ip_address = req.headers["x-forwarded-for"] as string || req.socket.remoteAddress || "";

    // Get HWID slot
    const hwidResult = await pool.query(
      `SELECT id, hwid_hash, unbind_count, last_unbind_at
       FROM hwid_slots
       WHERE id = $1 AND license_key = $2`,
      [hwid_id, license_key]
    );

    if (hwidResult.rows.length === 0) {
      return res.status(404).json({ message: "HWID binding not found" });
    }

    const hwid = hwidResult.rows[0];

    // Check rate limit (1 unbind per 7 days)
    if (hwid.last_unbind_at) {
      const daysSinceLastUnbind = (Date.now() - new Date(hwid.last_unbind_at).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceLastUnbind < 7) {
        return res.status(429).json({ 
          message: "You can only unbind once every 7 days",
          retry_after: Math.ceil(7 - daysSinceLastUnbind)
        });
      }
    }

    // Update unbind tracking
    await pool.query(
      `UPDATE hwid_slots
       SET unbind_count = unbind_count + 1, last_unbind_at = NOW()
       WHERE id = $1`,
      [hwid_id]
    );

    // Delete the HWID binding
    await pool.query("DELETE FROM hwid_slots WHERE id = $1", [hwid_id]);

    // Log action
    await pool.query(
      `INSERT INTO portal_actions (license_key, action_type, hwid_hash, ip_address)
       VALUES ($1, $2, $3, $4)`,
      [license_key, "unbind", hwid.hwid_hash, ip_address]
    );

    res.json({ success: true, message: "Device unbound successfully" });
  } catch (err) {
    console.error("Failed to unbind HWID:", err);
    res.status(500).json({ message: "Failed to unbind device" });
  }
});

// Public: Update device name
router.put("/public/portal/:license_key/device/:hwid_id/name", async (req: Request, res: Response) => {
  try {
    const { license_key, hwid_id } = req.params;
    const { device_name } = req.body;

    if (!device_name || device_name.length > 100) {
      return res.status(400).json({ message: "Invalid device name" });
    }

    // Verify HWID belongs to license
    const verifyResult = await pool.query(
      "SELECT id FROM hwid_slots WHERE id = $1 AND license_key = $2",
      [hwid_id, license_key]
    );

    if (verifyResult.rows.length === 0) {
      return res.status(404).json({ message: "HWID binding not found" });
    }

    await pool.query(
      "UPDATE hwid_slots SET device_name = $1 WHERE id = $2",
      [device_name, hwid_id]
    );

    res.json({ success: true });
  } catch (err) {
    console.error("Failed to update device name:", err);
    res.status(500).json({ message: "Failed to update device name" });
  }
});

// Public: Get live validation count (for landing page)
router.get("/public/stats", async (req: Request, res: Response) => {
  try {
    // Get total validations today
    const validationsToday = await pool.query(
      `SELECT COUNT(*) FROM validation_logs
       WHERE created_at >= CURRENT_DATE`
    );

    // Get total licenses
    const totalLicenses = await pool.query("SELECT COUNT(*) FROM licenses");

    // Get active licenses
    const activeLicenses = await pool.query(
      "SELECT COUNT(*) FROM licenses WHERE expires_at > NOW() AND is_banned = FALSE"
    );

    res.json({
      validations_today: parseInt(validationsToday.rows[0].count),
      total_licenses: parseInt(totalLicenses.rows[0].count),
      active_licenses: parseInt(activeLicenses.rows[0].count)
    });
  } catch (err) {
    console.error("Failed to fetch public stats:", err);
    res.status(500).json({ message: "Failed to fetch stats" });
  }
});

// ================================================================
// DYNAMIC CONTENT SYSTEM ENDPOINTS
// ================================================================

// -------------------- BLOG ENDPOINTS --------------------

// GET /api/v1/public/blog - Get all published blog posts
app.get("/api/v1/public/blog", async (req, res) => {
  try {
    const { category, featured, limit = "10", offset = "0" } = req.query;
    
    let query = `
      SELECT post_id, title, slug, excerpt, featured_emoji, category, 
             read_time_minutes, published_at, views, likes, author_email
      FROM blog_posts
      WHERE is_published = true
    `;
    const params: any[] = [];
    let paramCount = 0;

    if (category) {
      paramCount++;
      query += ` AND category = $${paramCount}`;
      params.push(category);
    }

    if (featured === "true") {
      query += ` AND is_featured = true`;
    }

    query += ` ORDER BY published_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    
    // Get total count
    const countResult = await pool.query(
      `SELECT COUNT(*) FROM blog_posts WHERE is_published = true`
    );

    res.json({
      posts: result.rows,
      total: parseInt(countResult.rows[0].count),
      limit: parseInt(limit as string),
      offset: parseInt(offset as string)
    });
  } catch (err) {
    console.error("Failed to fetch blog posts:", err);
    res.status(500).json({ message: "Failed to fetch blog posts" });
  }
});

// GET /api/v1/public/blog/:slug - Get single blog post
app.get("/api/v1/public/blog/:slug", async (req, res) => {
  try {
    const { slug } = req.params;

    // Increment view count
    await pool.query(
      `UPDATE blog_posts SET views = views + 1 WHERE slug = $1 AND is_published = true`,
      [slug]
    );

    const result = await pool.query(
      `SELECT * FROM blog_posts WHERE slug = $1 AND is_published = true`,
      [slug]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Blog post not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Failed to fetch blog post:", err);
    res.status(500).json({ message: "Failed to fetch blog post" });
  }
});

// POST /api/v1/public/blog/:slug/like - Like a blog post (rate limited)
app.post("/api/v1/public/blog/:slug/like", async (req, res) => {
  try {
    const { slug } = req.params;

    await pool.query(
      `UPDATE blog_posts SET likes = likes + 1 WHERE slug = $1 AND is_published = true`,
      [slug]
    );

    res.json({ success: true });
  } catch (err) {
    console.error("Failed to like blog post:", err);
    res.status(500).json({ message: "Failed to like post" });
  }
});

// POST /api/v1/admin/blog - Create blog post (ADMIN)
app.post("/api/v1/admin/blog", authenticateToken, async (req, res) => {
  try {
    const { title, excerpt, content, featured_emoji, category, read_time_minutes, is_featured, is_published } = req.body;
    
    // Generate slug from title
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    
    const result = await pool.query(
      `INSERT INTO blog_posts (title, slug, excerpt, content, featured_emoji, author_email, category, 
       read_time_minutes, is_featured, is_published, published_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [title, slug, excerpt, content, featured_emoji, req.user.email, category, 
       read_time_minutes, is_featured, is_published, is_published ? new Date() : null]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Failed to create blog post:", err);
    res.status(500).json({ message: "Failed to create blog post" });
  }
});

// PUT /api/v1/admin/blog/:post_id - Update blog post (ADMIN)
app.put("/api/v1/admin/blog/:post_id", authenticateToken, async (req, res) => {
  try {
    const { post_id } = req.params;
    const { title, excerpt, content, featured_emoji, category, read_time_minutes, is_featured, is_published } = req.body;

    const result = await pool.query(
      `UPDATE blog_posts 
       SET title = $1, excerpt = $2, content = $3, featured_emoji = $4, category = $5,
           read_time_minutes = $6, is_featured = $7, is_published = $8, updated_at = NOW(),
           published_at = CASE WHEN $8 = true AND published_at IS NULL THEN NOW() ELSE published_at END
       WHERE post_id = $9
       RETURNING *`,
      [title, excerpt, content, featured_emoji, category, read_time_minutes, is_featured, is_published, post_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Blog post not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Failed to update blog post:", err);
    res.status(500).json({ message: "Failed to update blog post" });
  }
});

// DELETE /api/v1/admin/blog/:post_id - Delete blog post (ADMIN)
app.delete("/api/v1/admin/blog/:post_id", authenticateToken, async (req, res) => {
  try {
    const { post_id } = req.params;

    await pool.query(`DELETE FROM blog_posts WHERE post_id = $1`, [post_id]);

    res.json({ success: true });
  } catch (err) {
    console.error("Failed to delete blog post:", err);
    res.status(500).json({ message: "Failed to delete blog post" });
  }
});

// -------------------- CHANGELOG ENDPOINTS --------------------

// GET /api/v1/public/changelog - Get all changelog entries
app.get("/api/v1/public/changelog", async (req, res) => {
  try {
    const entriesResult = await pool.query(
      `SELECT * FROM changelog_entries WHERE is_published = true ORDER BY release_date DESC`
    );

    const entries = await Promise.all(
      entriesResult.rows.map(async (entry) => {
        const changesResult = await pool.query(
          `SELECT change_type, description FROM changelog_changes 
           WHERE entry_id = $1 ORDER BY sort_order, change_id`,
          [entry.entry_id]
        );

        // Group changes by type
        const changes: any = { new: [], improved: [], fixed: [], deprecated: [], security: [] };
        changesResult.rows.forEach((change) => {
          changes[change.change_type].push(change.description);
        });

        return {
          version: entry.version,
          date: entry.release_date,
          changes
        };
      })
    );

    res.json(entries);
  } catch (err) {
    console.error("Failed to fetch changelog:", err);
    res.status(500).json({ message: "Failed to fetch changelog" });
  }
});

// POST /api/v1/admin/changelog - Create changelog entry (ADMIN)
app.post("/api/v1/admin/changelog", authenticateToken, async (req, res) => {
  try {
    const { version, release_date, changes } = req.body;

    // Create entry
    const entryResult = await pool.query(
      `INSERT INTO changelog_entries (version, release_date) VALUES ($1, $2) RETURNING *`,
      [version, release_date]
    );

    const entry_id = entryResult.rows[0].entry_id;

    // Add changes
    for (const [type, descriptions] of Object.entries(changes)) {
      if (Array.isArray(descriptions)) {
        for (const description of descriptions) {
          await pool.query(
            `INSERT INTO changelog_changes (entry_id, change_type, description) VALUES ($1, $2, $3)`,
            [entry_id, type, description]
          );
        }
      }
    }

    res.status(201).json(entryResult.rows[0]);
  } catch (err) {
    console.error("Failed to create changelog:", err);
    res.status(500).json({ message: "Failed to create changelog" });
  }
});

// DELETE /api/v1/admin/changelog/:entry_id - Delete changelog entry (ADMIN)
app.delete("/api/v1/admin/changelog/:entry_id", authenticateToken, async (req, res) => {
  try {
    const { entry_id } = req.params;

    await pool.query(`DELETE FROM changelog_entries WHERE entry_id = $1`, [entry_id]);

    res.json({ success: true });
  } catch (err) {
    console.error("Failed to delete changelog:", err);
    res.status(500).json({ message: "Failed to delete changelog" });
  }
});

// -------------------- STATUS & MONITORING ENDPOINTS --------------------

// GET /api/v1/public/status - Get current service status
app.get("/api/v1/public/status", async (req, res) => {
  try {
    const monitorsResult = await pool.query(
      `SELECT m.*, 
        (SELECT status FROM service_status_logs 
         WHERE monitor_id = m.monitor_id 
         ORDER BY checked_at DESC LIMIT 1) as current_status,
        (SELECT response_time_ms FROM service_status_logs 
         WHERE monitor_id = m.monitor_id 
         ORDER BY checked_at DESC LIMIT 1) as last_response_time
       FROM service_monitors m
       WHERE is_active = true`
    );

    // Calculate uptime for each service (last 30 days)
    const services = await Promise.all(
      monitorsResult.rows.map(async (monitor) => {
        const uptimeResult = await pool.query(
          `SELECT 
            COUNT(*) as total_checks,
            COUNT(*) FILTER (WHERE status = 'operational') as operational_checks
           FROM service_status_logs
           WHERE monitor_id = $1 AND checked_at > NOW() - INTERVAL '30 days'`,
          [monitor.monitor_id]
        );

        const total = parseInt(uptimeResult.rows[0].total_checks);
        const operational = parseInt(uptimeResult.rows[0].operational_checks);
        const uptime = total > 0 ? ((operational / total) * 100).toFixed(2) : "100.00";

        return {
          name: monitor.service_name,
          description: monitor.service_description,
          status: monitor.current_status || "operational",
          uptime: `${uptime}%`,
          response_time_ms: monitor.last_response_time
        };
      })
    );

    // Get active incidents
    const incidentsResult = await pool.query(
      `SELECT i.*, m.service_name
       FROM status_incidents i
       JOIN service_monitors m ON i.monitor_id = m.monitor_id
       WHERE i.resolved_at IS NULL
       ORDER BY i.started_at DESC`
    );

    res.json({
      overall_status: services.every(s => s.status === "operational") ? "operational" : "degraded",
      services,
      active_incidents: incidentsResult.rows
    });
  } catch (err) {
    console.error("Failed to fetch status:", err);
    res.status(500).json({ message: "Failed to fetch status" });
  }
});

// GET /api/v1/public/status/incidents - Get recent incidents
app.get("/api/v1/public/status/incidents", async (req, res) => {
  try {
    const { limit = "10" } = req.query;

    const result = await pool.query(
      `SELECT i.*, m.service_name,
        (SELECT json_agg(json_build_object('message', message, 'status', status, 'posted_at', posted_at))
         FROM incident_updates WHERE incident_id = i.incident_id ORDER BY posted_at DESC) as updates
       FROM status_incidents i
       JOIN service_monitors m ON i.monitor_id = m.monitor_id
       ORDER BY i.started_at DESC
       LIMIT $1`,
      [limit]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("Failed to fetch incidents:", err);
    res.status(500).json({ message: "Failed to fetch incidents" });
  }
});

// POST /api/v1/admin/status/incident - Create incident (ADMIN)
app.post("/api/v1/admin/status/incident", authenticateToken, async (req, res) => {
  try {
    const { monitor_id, title, description, severity } = req.body;

    const result = await pool.query(
      `INSERT INTO status_incidents (monitor_id, title, description, severity, started_at)
       VALUES ($1, $2, $3, $4, NOW()) RETURNING *`,
      [monitor_id, title, description, severity]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Failed to create incident:", err);
    res.status(500).json({ message: "Failed to create incident" });
  }
});

// POST /api/v1/admin/status/incident/:incident_id/update - Add incident update (ADMIN)
app.post("/api/v1/admin/status/incident/:incident_id/update", authenticateToken, async (req, res) => {
  try {
    const { incident_id } = req.params;
    const { message, status } = req.body;

    await pool.query(
      `INSERT INTO incident_updates (incident_id, message, status) VALUES ($1, $2, $3)`,
      [incident_id, message, status]
    );

    // Update incident status and resolved_at if status is 'resolved'
    await pool.query(
      `UPDATE status_incidents 
       SET status = $1, resolved_at = CASE WHEN $1 = 'resolved' THEN NOW() ELSE resolved_at END
       WHERE incident_id = $2`,
      [status, incident_id]
    );

    res.json({ success: true });
  } catch (err) {
    console.error("Failed to add incident update:", err);
    res.status(500).json({ message: "Failed to add incident update" });
  }
});

// -------------------- TESTIMONIALS & FAQ ENDPOINTS --------------------

// GET /api/v1/public/testimonials - Get approved testimonials
app.get("/api/v1/public/testimonials", async (req, res) => {
  try {
    const { featured, limit = "20" } = req.query;

    let query = `SELECT * FROM testimonials WHERE is_approved = true`;
    
    if (featured === "true") {
      query += ` AND is_featured = true`;
    }

    query += ` ORDER BY display_order, testimonial_id DESC LIMIT $1`;

    const result = await pool.query(query, [limit]);

    res.json(result.rows);
  } catch (err) {
    console.error("Failed to fetch testimonials:", err);
    res.status(500).json({ message: "Failed to fetch testimonials" });
  }
});

// POST /api/v1/admin/testimonials - Create testimonial (ADMIN)
app.post("/api/v1/admin/testimonials", authenticateToken, async (req, res) => {
  try {
    const { author_name, author_role, author_company, author_avatar_url, quote, rating, is_featured } = req.body;

    const result = await pool.query(
      `INSERT INTO testimonials (author_name, author_role, author_company, author_avatar_url, 
       quote, rating, is_featured, is_approved, approved_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, true, NOW()) RETURNING *`,
      [author_name, author_role, author_company, author_avatar_url, quote, rating, is_featured]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Failed to create testimonial:", err);
    res.status(500).json({ message: "Failed to create testimonial" });
  }
});

// GET /api/v1/public/faqs - Get published FAQs
app.get("/api/v1/public/faqs", async (req, res) => {
  try {
    const { category, limit = "50" } = req.query;

    let query = `SELECT * FROM faqs WHERE is_published = true`;
    const params: any[] = [];

    if (category) {
      query += ` AND category = $1`;
      params.push(category);
    }

    query += ` ORDER BY display_order, faq_id LIMIT $${params.length + 1}`;
    params.push(limit);

    const result = await pool.query(query, params);

    res.json(result.rows);
  } catch (err) {
    console.error("Failed to fetch FAQs:", err);
    res.status(500).json({ message: "Failed to fetch FAQs" });
  }
});

// POST /api/v1/public/faqs/:faq_id/helpful - Mark FAQ as helpful
app.post("/api/v1/public/faqs/:faq_id/helpful", async (req, res) => {
  try {
    const { faq_id } = req.params;
    const { helpful } = req.body;

    const field = helpful ? "helpful_yes" : "helpful_no";
    
    await pool.query(
      `UPDATE faqs SET ${field} = ${field} + 1, views = views + 1 WHERE faq_id = $1`,
      [faq_id]
    );

    res.json({ success: true });
  } catch (err) {
    console.error("Failed to update FAQ:", err);
    res.status(500).json({ message: "Failed to update FAQ" });
  }
});

// POST /api/v1/admin/faqs - Create FAQ (ADMIN)
app.post("/api/v1/admin/faqs", authenticateToken, async (req, res) => {
  try {
    const { question, answer, category, display_order } = req.body;

    const result = await pool.query(
      `INSERT INTO faqs (question, answer, category, display_order) 
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [question, answer, category, display_order || 0]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Failed to create FAQ:", err);
    res.status(500).json({ message: "Failed to create FAQ" });
  }
});

// -------------------- SUPPORT TICKET ENDPOINTS --------------------

// GET /api/v1/support/tickets - Get user's tickets
app.get("/api/v1/support/tickets", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT t.*,
        (SELECT COUNT(*) FROM ticket_messages WHERE ticket_id = t.ticket_id) as message_count
       FROM support_tickets t
       WHERE user_email = $1
       ORDER BY created_at DESC`,
      [req.user.email]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("Failed to fetch tickets:", err);
    res.status(500).json({ message: "Failed to fetch tickets" });
  }
});

// GET /api/v1/support/tickets/:ticket_number - Get ticket details
app.get("/api/v1/support/tickets/:ticket_number", authenticateToken, async (req, res) => {
  try {
    const { ticket_number } = req.params;

    const ticketResult = await pool.query(
      `SELECT * FROM support_tickets WHERE ticket_number = $1 AND user_email = $2`,
      [ticket_number, req.user.email]
    );

    if (ticketResult.rows.length === 0) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    const messagesResult = await pool.query(
      `SELECT * FROM ticket_messages WHERE ticket_id = $1 AND is_internal_note = false ORDER BY created_at`,
      [ticketResult.rows[0].ticket_id]
    );

    res.json({
      ticket: ticketResult.rows[0],
      messages: messagesResult.rows
    });
  } catch (err) {
    console.error("Failed to fetch ticket:", err);
    res.status(500).json({ message: "Failed to fetch ticket" });
  }
});

// POST /api/v1/support/tickets - Create support ticket
app.post("/api/v1/support/tickets", authenticateToken, async (req, res) => {
  try {
    const { subject, priority, category, message } = req.body;

    // Generate ticket number
    const countResult = await pool.query(`SELECT COUNT(*) FROM support_tickets`);
    const ticket_number = `TKT-${String(parseInt(countResult.rows[0].count) + 1000).padStart(4, '0')}`;

    const ticketResult = await pool.query(
      `INSERT INTO support_tickets (ticket_number, user_email, subject, priority, category)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [ticket_number, req.user.email, subject, priority, category]
    );

    // Add first message
    await pool.query(
      `INSERT INTO ticket_messages (ticket_id, sender_email, message)
       VALUES ($1, $2, $3)`,
      [ticketResult.rows[0].ticket_id, req.user.email, message]
    );

    res.status(201).json(ticketResult.rows[0]);
  } catch (err) {
    console.error("Failed to create ticket:", err);
    res.status(500).json({ message: "Failed to create ticket" });
  }
});

// POST /api/v1/support/tickets/:ticket_number/messages - Reply to ticket
app.post("/api/v1/support/tickets/:ticket_number/messages", authenticateToken, async (req, res) => {
  try {
    const { ticket_number } = req.params;
    const { message } = req.body;

    const ticketResult = await pool.query(
      `SELECT ticket_id FROM support_tickets WHERE ticket_number = $1 AND user_email = $2`,
      [ticket_number, req.user.email]
    );

    if (ticketResult.rows.length === 0) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    await pool.query(
      `INSERT INTO ticket_messages (ticket_id, sender_email, message)
       VALUES ($1, $2, $3)`,
      [ticketResult.rows[0].ticket_id, req.user.email, message]
    );

    // Update ticket
    await pool.query(
      `UPDATE support_tickets 
       SET updated_at = NOW(), last_customer_reply_at = NOW(), status = 'open'
       WHERE ticket_id = $1`,
      [ticketResult.rows[0].ticket_id]
    );

    res.json({ success: true });
  } catch (err) {
    console.error("Failed to add message:", err);
    res.status(500).json({ message: "Failed to add message" });
  }
});

// -------------------- CONTACT FORM ENDPOINT --------------------

// POST /api/v1/public/contact - Submit contact form
app.post("/api/v1/public/contact", async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    const ip_address = req.ip;
    const user_agent = req.headers["user-agent"];

    await pool.query(
      `INSERT INTO contact_submissions (name, email, subject, message, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [name, email, subject, message, ip_address, user_agent]
    );

    res.json({ success: true, message: "Thank you for contacting us! We'll get back to you within 24 hours." });
  } catch (err) {
    console.error("Failed to submit contact form:", err);
    res.status(500).json({ message: "Failed to submit contact form" });
  }
});

// GET /api/v1/admin/contact - Get contact submissions (ADMIN)
app.get("/api/v1/admin/contact", authenticateToken, async (req, res) => {
  try {
    const { is_read, limit = "50", offset = "0" } = req.query;

    let query = `SELECT * FROM contact_submissions WHERE is_spam = false`;
    const params: any[] = [];

    if (is_read !== undefined) {
      params.push(is_read === "true");
      query += ` AND is_read = $${params.length}`;
    }

    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    res.json(result.rows);
  } catch (err) {
    console.error("Failed to fetch contact submissions:", err);
    res.status(500).json({ message: "Failed to fetch submissions" });
  }
});

// -------------------- COMPANY INFO ENDPOINTS --------------------

// GET /api/v1/public/about/milestones - Get company milestones
app.get("/api/v1/public/about/milestones", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM company_milestones WHERE is_published = true ORDER BY year DESC, month DESC, display_order`
    );

    res.json(result.rows);
  } catch (err) {
    console.error("Failed to fetch milestones:", err);
    res.status(500).json({ message: "Failed to fetch milestones" });
  }
});

