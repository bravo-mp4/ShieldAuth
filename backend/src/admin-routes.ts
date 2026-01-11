// Admin API Endpoints
// Add these to your existing routes.ts file

import { Request, Response } from 'express';
import { pool } from './database';
import { requireAdmin, auditLog } from './middleware/security';
import logger from './logger';

// ============================================
// ADMIN STATS
// ============================================

export const getAdminStats = async (req: Request, res: Response) => {
  try {
    const stats = await pool.query('SELECT * FROM admin_stats');
    res.json(stats.rows[0]);
  } catch (error) {
    logger.error('[ERR_ADMIN_STATS] Failed to fetch admin stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats', code: 'ERR_ADMIN_STATS' });
  }
};

// ============================================
// USER MANAGEMENT
// ============================================

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await pool.query(`
      SELECT user_id, email, role, is_banned, created_at, last_login, subscription_tier
      FROM users
      ORDER BY created_at DESC
    `);
    res.json(users.rows);
  } catch (error) {
    logger.error('[ERR_ADMIN_USERS] Failed to fetch users:', error);
    res.status(500).json({ error: 'Failed to fetch users', code: 'ERR_ADMIN_USERS' });
  }
};

export const banUser = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { is_banned } = req.body;

  try {
    await pool.query(
      'UPDATE users SET is_banned = $1 WHERE user_id = $2',
      [is_banned, id]
    );
    
    logger.info(`[ADMIN] User ${id} ${is_banned ? 'banned' : 'unbanned'} by ${req.user!.email}`);
    res.json({ success: true });
  } catch (error) {
    logger.error('[ERR_ADMIN_BAN] Failed to ban user:', error);
    res.status(500).json({ error: 'Failed to update user', code: 'ERR_ADMIN_BAN' });
  }
};

export const changeUserRole = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { role } = req.body;

  try {
    await pool.query(
      'UPDATE users SET role = $1 WHERE user_id = $2',
      [role, id]
    );
    
    logger.info(`[ADMIN] User ${id} role changed to ${role} by ${req.user!.email}`);
    res.json({ success: true });
  } catch (error) {
    logger.error('[ERR_ADMIN_ROLE] Failed to change role:', error);
    res.status(500).json({ error: 'Failed to change role', code: 'ERR_ADMIN_ROLE' });
  }
};

// ============================================
// BLOG MANAGEMENT
// ============================================

export const createBlogPost = async (req: Request, res: Response) => {
  const { title, slug, excerpt, content, category, is_published } = req.body;

  try {
    const result = await pool.query(`
      INSERT INTO blog_posts (title, slug, excerpt, content, category, is_published, author_email, published_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING post_id
    `, [title, slug, excerpt, content, category, is_published, req.user!.email, is_published ? new Date() : null]);

    logger.info(`[ADMIN] Blog post created: ${title} by ${req.user!.email}`);
    res.json({ success: true, post_id: result.rows[0].post_id });
  } catch (error) {
    logger.error('[ERR_ADMIN_BLOG_CREATE] Failed to create blog post:', error);
    res.status(500).json({ error: 'Failed to create post', code: 'ERR_ADMIN_BLOG_CREATE' });
  }
};

export const updateBlogPost = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { title, slug, excerpt, content, category, is_published } = req.body;

  try {
    await pool.query(`
      UPDATE blog_posts 
      SET title = $1, slug = $2, excerpt = $3, content = $4, category = $5, 
          is_published = $6, updated_at = NOW(),
          published_at = CASE WHEN $6 = true AND published_at IS NULL THEN NOW() ELSE published_at END
      WHERE post_id = $7
    `, [title, slug, excerpt, content, category, is_published, id]);

    logger.info(`[ADMIN] Blog post ${id} updated by ${req.user!.email}`);
    res.json({ success: true });
  } catch (error) {
    logger.error('[ERR_ADMIN_BLOG_UPDATE] Failed to update blog post:', error);
    res.status(500).json({ error: 'Failed to update post', code: 'ERR_ADMIN_BLOG_UPDATE' });
  }
};

export const deleteBlogPost = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    await pool.query('DELETE FROM blog_posts WHERE post_id = $1', [id]);
    logger.info(`[ADMIN] Blog post ${id} deleted by ${req.user!.email}`);
    res.json({ success: true });
  } catch (error) {
    logger.error('[ERR_ADMIN_BLOG_DELETE] Failed to delete blog post:', error);
    res.status(500).json({ error: 'Failed to delete post', code: 'ERR_ADMIN_BLOG_DELETE' });
  }
};

// ============================================
// CHANGELOG MANAGEMENT
// ============================================

export const createChangelog = async (req: Request, res: Response) => {
  const { version, release_date, is_published, changes } = req.body;

  try {
    // Create entry
    const entryResult = await pool.query(`
      INSERT INTO changelog_entries (version, release_date, is_published)
      VALUES ($1, $2, $3)
      RETURNING entry_id
    `, [version, release_date, is_published]);

    const entryId = entryResult.rows[0].entry_id;

    // Add changes
    for (let i = 0; i < changes.length; i++) {
      await pool.query(`
        INSERT INTO changelog_changes (entry_id, change_type, description, display_order)
        VALUES ($1, $2, $3, $4)
      `, [entryId, changes[i].type, changes[i].description, i]);
    }

    logger.info(`[ADMIN] Changelog ${version} created by ${req.user!.email}`);
    res.json({ success: true, entry_id: entryId });
  } catch (error) {
    logger.error('[ERR_ADMIN_CHANGELOG] Failed to create changelog:', error);
    res.status(500).json({ error: 'Failed to create changelog', code: 'ERR_ADMIN_CHANGELOG' });
  }
};

export const updateChangelog = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { version, release_date, is_published } = req.body;

  try {
    await pool.query(`
      UPDATE changelog_entries
      SET version = $1, release_date = $2, is_published = $3
      WHERE entry_id = $4
    `, [version, release_date, is_published, id]);

    logger.info(`[ADMIN] Changelog ${id} updated by ${req.user!.email}`);
    res.json({ success: true });
  } catch (error) {
    logger.error('[ERR_ADMIN_CHANGELOG_UPDATE] Failed to update changelog:', error);
    res.status(500).json({ error: 'Failed to update changelog', code: 'ERR_ADMIN_CHANGELOG_UPDATE' });
  }
};

export const deleteChangelog = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    await pool.query('DELETE FROM changelog_entries WHERE entry_id = $1', [id]);
    logger.info(`[ADMIN] Changelog ${id} deleted by ${req.user!.email}`);
    res.json({ success: true });
  } catch (error) {
    logger.error('[ERR_ADMIN_CHANGELOG_DELETE] Failed to delete changelog:', error);
    res.status(500).json({ error: 'Failed to delete changelog', code: 'ERR_ADMIN_CHANGELOG_DELETE' });
  }
};

// ============================================
// LICENSE MANAGEMENT
// ============================================

export const extendLicense = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { days } = req.body;

  try {
    await pool.query(`
      UPDATE licenses
      SET expires_at = expires_at + INTERVAL '${days} days'
      WHERE license_id = $1
    `, [id]);

    logger.info(`[ADMIN] License ${id} extended by ${days} days by ${req.user!.email}`);
    res.json({ success: true });
  } catch (error) {
    logger.error('[ERR_ADMIN_LICENSE_EXTEND] Failed to extend license:', error);
    res.status(500).json({ error: 'Failed to extend license', code: 'ERR_ADMIN_LICENSE_EXTEND' });
  }
};

export const forceExpireLicense = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    await pool.query(`
      UPDATE licenses
      SET status = 'expired', expires_at = NOW()
      WHERE license_id = $1
    `, [id]);

    logger.info(`[ADMIN] License ${id} force expired by ${req.user!.email}`);
    res.json({ success: true });
  } catch (error) {
    logger.error('[ERR_ADMIN_LICENSE_EXPIRE] Failed to expire license:', error);
    res.status(500).json({ error: 'Failed to expire license', code: 'ERR_ADMIN_LICENSE_EXPIRE' });
  }
};

export const blacklistHWID = async (req: Request, res: Response) => {
  const { hwid, reason } = req.body;

  try {
    await pool.query(`
      INSERT INTO hwid_blacklist (hwid, reason, blacklisted_by)
      VALUES ($1, $2, $3)
    `, [hwid, reason, req.user!.email]);

    logger.info(`[ADMIN] HWID ${hwid} blacklisted by ${req.user!.email}`);
    res.json({ success: true });
  } catch (error) {
    logger.error('[ERR_ADMIN_HWID_BLACKLIST] Failed to blacklist HWID:', error);
    res.status(500).json({ error: 'Failed to blacklist HWID', code: 'ERR_ADMIN_HWID_BLACKLIST' });
  }
};

// ============================================
// Add to routes.ts:
// ============================================

/*
import { requireAdmin, auditLog } from './middleware/security';

// Admin Stats
router.get('/api/v1/admin/stats', requireAdmin, getAdminStats);

// User Management
router.get('/api/v1/admin/users', requireAdmin, getAllUsers);
router.put('/api/v1/admin/users/:id/ban', requireAdmin, auditLog('ban_user'), banUser);
router.put('/api/v1/admin/users/:id/role', requireAdmin, auditLog('change_role'), changeUserRole);

// Blog Management
router.post('/api/v1/admin/blog', requireAdmin, auditLog('create_blog'), createBlogPost);
router.put('/api/v1/admin/blog/:id', requireAdmin, auditLog('update_blog'), updateBlogPost);
router.delete('/api/v1/admin/blog/:id', requireAdmin, auditLog('delete_blog'), deleteBlogPost);

// Changelog Management
router.post('/api/v1/admin/changelog', requireAdmin, auditLog('create_changelog'), createChangelog);
router.put('/api/v1/admin/changelog/:id', requireAdmin, updateChangelog);
router.delete('/api/v1/admin/changelog/:id', requireAdmin, deleteChangelog);

// License Management
router.put('/api/v1/admin/licenses/:id/extend', requireAdmin, auditLog('extend_license'), extendLicense);
router.put('/api/v1/admin/licenses/:id/expire', requireAdmin, auditLog('expire_license'), forceExpireLicense);
router.post('/api/v1/admin/hwid/blacklist', requireAdmin, auditLog('blacklist_hwid'), blacklistHWID);
*/
