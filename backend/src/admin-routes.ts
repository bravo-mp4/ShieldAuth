// Platform-admin handlers. Mounted in routes.ts behind requireAdmin.

import { Request, Response } from "express";
import { pool } from "./database";

function text(value: unknown, max: number): string | null {
  return typeof value === "string" && value.trim() ? value.slice(0, max) : null;
}

function positiveInt(value: unknown): number | null {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

// ============================================
// ADMIN STATS
// ============================================

export const getAdminStats = async (_req: Request, res: Response) => {
  const result = await pool.query(`
    SELECT
      (SELECT COUNT(*) FROM users) AS total_users,
      (SELECT COUNT(*) FROM applications) AS total_applications,
      (SELECT COUNT(*) FROM licenses) AS total_licenses,
      (SELECT COUNT(*) FROM licenses
        WHERE is_banned = FALSE AND (expires_at IS NULL OR expires_at > NOW())) AS active_licenses,
      (SELECT COUNT(*) FROM validation_logs WHERE created_at >= CURRENT_DATE) AS validations_today,
      (SELECT COUNT(*) FROM validation_logs
        WHERE created_at >= CURRENT_DATE AND result <> 'success') AS failed_validations_today
  `);
  const row = result.rows[0];
  const n = (value: string) => Number.parseInt(value, 10);
  res.json({
    totalUsers: n(row.total_users),
    totalApplications: n(row.total_applications),
    totalLicenses: n(row.total_licenses),
    activeLicenses: n(row.active_licenses),
    validationsToday: n(row.validations_today),
    failedValidationsToday: n(row.failed_validations_today),
  });
};

// ============================================
// USER MANAGEMENT
// ============================================

export const getAllUsers = async (_req: Request, res: Response) => {
  const users = await pool.query(`
    SELECT id AS user_id, email, role, is_banned, created_at, last_login
    FROM users
    ORDER BY created_at DESC
    LIMIT 500
  `);
  res.json(users.rows);
};

export const banUser = async (req: Request, res: Response) => {
  const id = positiveInt(req.params.id);
  if (!id || typeof req.body?.is_banned !== "boolean") {
    return res.status(400).json({ message: "A user id and is_banned (boolean) are required" });
  }
  if (id === req.user!.id) {
    return res.status(400).json({ message: "You can't ban your own account" });
  }

  const result = await pool.query("UPDATE users SET is_banned = $1 WHERE id = $2", [req.body.is_banned, id]);
  if (result.rowCount === 0) {
    return res.status(404).json({ message: "User not found" });
  }
  res.json({ success: true });
};

export const changeUserRole = async (req: Request, res: Response) => {
  const id = positiveInt(req.params.id);
  const { role } = req.body ?? {};
  if (!id || !["user", "admin"].includes(role)) {
    return res.status(400).json({ message: "role must be 'user' or 'admin'" });
  }
  if (id === req.user!.id && role !== "admin") {
    return res.status(400).json({ message: "You can't remove your own admin role" });
  }

  const result = await pool.query("UPDATE users SET role = $1 WHERE id = $2", [role, id]);
  if (result.rowCount === 0) {
    return res.status(404).json({ message: "User not found" });
  }
  res.json({ success: true });
};

// ============================================
// LICENSE MANAGEMENT (any application)
// ============================================

export const extendLicense = async (req: Request, res: Response) => {
  const days = positiveInt(req.body?.days);
  if (!days || days > 3650) {
    return res.status(400).json({ message: "days must be between 1 and 3650" });
  }

  // make_interval keeps "days" a bound parameter. Building the interval with
  // string interpolation, as this used to, was a SQL injection.
  const result = await pool.query(
    `UPDATE licenses
     SET expires_at = GREATEST(COALESCE(expires_at, NOW()), NOW()) + make_interval(days => $1)
     WHERE license_key = $2`,
    [days, req.params.key]
  );
  if (result.rowCount === 0) {
    return res.status(404).json({ message: "License not found" });
  }
  res.json({ success: true });
};

export const forceExpireLicense = async (req: Request, res: Response) => {
  const result = await pool.query(
    "UPDATE licenses SET status = 'expired', expires_at = NOW() WHERE license_key = $1",
    [req.params.key]
  );
  if (result.rowCount === 0) {
    return res.status(404).json({ message: "License not found" });
  }
  await pool.query("DELETE FROM sessions WHERE license_key = $1", [req.params.key]);
  res.json({ success: true });
};

export const blacklistHWID = async (req: Request, res: Response) => {
  const hwid = text(req.body?.hwid, 128);
  if (!hwid) {
    return res.status(400).json({ message: "hwid is required" });
  }

  await pool.query(
    `INSERT INTO hwid_blacklist (hwid, reason, blacklisted_by) VALUES ($1, $2, $3)
     ON CONFLICT (hwid) DO UPDATE SET reason = EXCLUDED.reason`,
    [hwid, text(req.body?.reason, 1000), req.user!.email]
  );
  await pool.query("DELETE FROM sessions WHERE hwid_hash = $1", [hwid]);
  res.json({ success: true });
};
