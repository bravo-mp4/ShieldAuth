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

  // Get license
  const license = await getLicense(license_key);

  if (
    !license ||
    license.is_banned ||
    new Date(license.expires_at) < new Date()
  ) {
    return res.json({ valid: false, message: "Invalid or expired license" });
  }

  // Check HWID
  const hwids = await getHWIDs(license_key);

  if (hwids.length === 0) {
    await bindHWID(license_key, hwid);
  } else if (!hwids.includes(hwid)) {
    if (hwids.length >= license.max_hwid_slots) {
      return res.json({ valid: false, message: "HWID limit reached" });
    }
    await bindHWID(license_key, hwid);
  }

  // Create session
  const sessionId = crypto.randomBytes(32).toString("hex");
  await createSession(sessionId, license_key, hwid);

  const response: ValidateResponse = {
    valid: true,
    message: "License validated",
    expires_at: new Date(license.expires_at).getTime() / 1000,
    session_id: sessionId,
  };

  res.json(response);
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
router.post("/admin/license/ban", async (req: Request, res: Response) => {
  const { license_key } = req.body;

  await pool.query(
    "UPDATE licenses SET is_banned = TRUE WHERE license_key = $1",
    [license_key]
  );

  res.json({ success: true });
});
