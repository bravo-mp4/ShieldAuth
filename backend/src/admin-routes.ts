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
  const stats = await pool.query("SELECT * FROM admin_stats");
  res.json(stats.rows[0]);
};

// ============================================
// USER MANAGEMENT
// ============================================

export const getAllUsers = async (_req: Request, res: Response) => {
  const users = await pool.query(`
    SELECT id AS user_id, email, role, is_banned, created_at, last_login, subscription_tier
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
// BLOG MANAGEMENT
// ============================================

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 200);
}

export const createBlogPost = async (req: Request, res: Response) => {
  const { category, is_published } = req.body ?? {};
  const title = text(req.body?.title, 255);
  const content = text(req.body?.content, 100000);
  if (!title || !content) {
    return res.status(400).json({ message: "Title and content are required" });
  }
  const slug = slugify(text(req.body?.slug, 255) || title);

  const result = await pool.query(
    `INSERT INTO blog_posts (title, slug, excerpt, content, category, is_published, author_email, published_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING post_id`,
    [
      title,
      slug,
      text(req.body?.excerpt, 1000),
      content,
      text(category, 50) || "General",
      Boolean(is_published),
      req.user!.email,
      is_published ? new Date() : null,
    ]
  );
  res.status(201).json({ success: true, post_id: result.rows[0].post_id });
};

export const updateBlogPost = async (req: Request, res: Response) => {
  const id = positiveInt(req.params.id);
  const title = text(req.body?.title, 255);
  const content = text(req.body?.content, 100000);
  if (!id || !title || !content) {
    return res.status(400).json({ message: "Title and content are required" });
  }

  const result = await pool.query(
    `UPDATE blog_posts
     SET title = $1, slug = $2, excerpt = $3, content = $4, category = $5,
         is_published = $6, updated_at = NOW(),
         published_at = CASE WHEN $6 = true AND published_at IS NULL THEN NOW() ELSE published_at END
     WHERE post_id = $7`,
    [
      title,
      slugify(text(req.body?.slug, 255) || title),
      text(req.body?.excerpt, 1000),
      content,
      text(req.body?.category, 50) || "General",
      Boolean(req.body?.is_published),
      id,
    ]
  );
  if (result.rowCount === 0) {
    return res.status(404).json({ message: "Blog post not found" });
  }
  res.json({ success: true });
};

export const deleteBlogPost = async (req: Request, res: Response) => {
  await pool.query("DELETE FROM blog_posts WHERE post_id = $1", [positiveInt(req.params.id)]);
  res.json({ success: true });
};

// ============================================
// CHANGELOG MANAGEMENT
// ============================================

const CHANGE_TYPES = ["new", "improved", "fixed", "deprecated", "security"];

export const createChangelog = async (req: Request, res: Response) => {
  const { release_date, is_published, changes } = req.body ?? {};
  const version = text(req.body?.version, 20);

  if (
    !version ||
    typeof release_date !== "string" ||
    !Array.isArray(changes) ||
    !changes.every((c) => CHANGE_TYPES.includes(c?.type) && typeof c?.description === "string")
  ) {
    return res.status(400).json({ message: "version, release_date and a list of changes are required" });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const entry = await client.query(
      "INSERT INTO changelog_entries (version, release_date, is_published) VALUES ($1, $2, $3) RETURNING entry_id",
      [version, release_date, is_published !== false]
    );
    const entryId = entry.rows[0].entry_id;

    for (const [index, change] of changes.entries()) {
      await client.query(
        "INSERT INTO changelog_changes (entry_id, change_type, description, sort_order) VALUES ($1, $2, $3, $4)",
        [entryId, change.type, change.description.slice(0, 2000), index]
      );
    }
    await client.query("COMMIT");
    res.status(201).json({ success: true, entry_id: entryId });
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

export const updateChangelog = async (req: Request, res: Response) => {
  const id = positiveInt(req.params.id);
  const version = text(req.body?.version, 20);
  if (!id || !version || typeof req.body?.release_date !== "string") {
    return res.status(400).json({ message: "version and release_date are required" });
  }

  await pool.query(
    "UPDATE changelog_entries SET version = $1, release_date = $2, is_published = $3 WHERE entry_id = $4",
    [version, req.body.release_date, req.body.is_published !== false, id]
  );
  res.json({ success: true });
};

export const deleteChangelog = async (req: Request, res: Response) => {
  await pool.query("DELETE FROM changelog_entries WHERE entry_id = $1", [positiveInt(req.params.id)]);
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
