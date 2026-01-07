import { Router, Request, Response } from "express";
import { ValidateRequest, ValidateResponse } from "./types";
import {
  getLicense,
  getHWIDs,
  bindHWID,
  createSession,
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

// Auth: Login
router.post("/auth/login", async (req: Request, res: Response) => {
  const { email, password } = req.body;

  // Demo credentials (in production, hash passwords and check database)
  if (email === "admin@shieldlabs.com" && password === "admin123") {
    const token = jwt.sign({ email, role: "admin" }, JWT_SECRET, {
      expiresIn: "24h",
    });

    return res.json({
      token,
      user: {
        email,
        role: "admin",
        name: "Admin User",
      },
    });
  }

  return res.status(401).json({ message: "Invalid email or password" });
});

// Auth: Register (placeholder)
router.post("/auth/register", async (req: Request, res: Response) => {
  const { email, password } = req.body;
  // TODO: Implement user registration
  res.status(501).json({ message: "Registration not yet implemented" });
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
        '' as email,
        l.expires_at,
        l.created_at,
        l.is_banned,
        COALESCE(array_agg(h.hwid) FILTER (WHERE h.hwid IS NOT NULL), ARRAY[]::text[]) as hwids
      FROM licenses l
      LEFT JOIN hwid_bindings h ON l.license_key = h.license_key
      GROUP BY l.license_key, l.expires_at, l.created_at, l.is_banned
      ORDER BY l.created_at DESC
      LIMIT 100
    `);

    const users = result.rows.map((user: any) => ({
      id: user.id,
      username: user.username,
      email: user.email,
      expires_at: user.expires_at,
      created_at: user.created_at,
      hwid: user.hwids[0] || "",
      status: user.is_banned
        ? "banned"
        : new Date(user.expires_at) > new Date()
        ? "active"
        : "expired",
    }));

    res.json(users);
  } catch (err) {
    console.error(err);
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

// Logs endpoints (protected)
router.get("/logs", authenticateToken, async (req: Request, res: Response) => {
  try {
    // TODO: Implement proper logging table
    // For now, return mock data
    res.json([
      {
        id: "1",
        timestamp: new Date().toISOString(),
        type: "auth",
        message: "Successful authentication",
        username: "user123",
        ip: "192.168.1.100",
      },
    ]);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch logs" });
  }
});

// Admin: Create application
router.post("/admin/app/create", async (req: Request, res: Response) => {
  const { owner_email } = req.body;

  const appId = crypto.randomBytes(16).toString("hex");
  const appSecret = crypto.randomBytes(32).toString("hex");

  await pool.query(
    "INSERT INTO applications (app_id, app_secret, owner_email) VALUES ($1, $2, $3)",
    [appId, appSecret, owner_email]
  );

  res.json({ app_id: appId, app_secret: appSecret });
});

// Admin: Generate license
router.post("/admin/license/create", async (req: Request, res: Response) => {
  const { app_id, days, max_hwid_slots } = req.body;

  const licenseKey = generateLicenseKey();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + (days || 30));

  await pool.query(
    "INSERT INTO licenses (license_key, app_id, expires_at, max_hwid_slots) VALUES ($1, $2, $3, $4)",
    [licenseKey, app_id, expiresAt, max_hwid_slots || 1]
  );

  res.json({ license_key: licenseKey, expires_at: expiresAt });
});

// Admin: List licenses for app
router.get("/admin/licenses/:app_id", async (req: Request, res: Response) => {
  const { app_id } = req.params;

  const result = await pool.query(
    "SELECT license_key, expires_at, is_banned, created_at FROM licenses WHERE app_id = $1",
    [app_id]
  );

  res.json(result.rows);
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
