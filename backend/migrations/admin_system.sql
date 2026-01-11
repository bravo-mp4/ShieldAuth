-- Admin System Migration
-- Run this after your existing dynamic_content_system.sql

-- ============================================
-- 1. AUDIT LOGGING
-- ============================================

CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  admin_email VARCHAR(255) NOT NULL,
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50),
  resource_id INTEGER,
  ip_address VARCHAR(45),
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_audit_admin ON audit_logs(admin_email);
CREATE INDEX idx_audit_action ON audit_logs(action);
CREATE INDEX idx_audit_created ON audit_logs(created_at DESC);

-- ============================================
-- 2. USER ENHANCEMENTS
-- ============================================

-- Add admin role and ban status
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user';
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_tier VARCHAR(20) DEFAULT 'free';

CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_banned ON users(is_banned);

-- ============================================
-- 3. APPLICATION APPROVAL SYSTEM
-- ============================================

ALTER TABLE applications ADD COLUMN IF NOT EXISTS approval_status VARCHAR(20) DEFAULT 'approved';
ALTER TABLE applications ADD COLUMN IF NOT EXISTS approved_by VARCHAR(255);
ALTER TABLE applications ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

CREATE INDEX idx_applications_approval ON applications(approval_status);

-- ============================================
-- 4. HWID BLACKLIST
-- ============================================

CREATE TABLE IF NOT EXISTS hwid_blacklist (
  id SERIAL PRIMARY KEY,
  hwid VARCHAR(255) UNIQUE NOT NULL,
  reason TEXT,
  blacklisted_by VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_hwid_blacklist_hwid ON hwid_blacklist(hwid);

-- ============================================
-- 5. WEBHOOKS & DELIVERY LOGS
-- ============================================

-- First create webhooks table if it doesn't exist
CREATE TABLE IF NOT EXISTS webhooks (
  id SERIAL PRIMARY KEY,
  user_email VARCHAR(255) NOT NULL,
  url VARCHAR(500) NOT NULL,
  events TEXT[] DEFAULT ARRAY['license.created', 'license.validated', 'user.created'],
  is_active BOOLEAN DEFAULT TRUE,
  secret VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_webhooks_user ON webhooks(user_email);
CREATE INDEX idx_webhooks_active ON webhooks(is_active);

-- Then create webhook logs
CREATE TABLE IF NOT EXISTS webhook_logs (
  id SERIAL PRIMARY KEY,
  webhook_id INTEGER REFERENCES webhooks(id) ON DELETE CASCADE,
  event_type VARCHAR(50),
  payload JSONB,
  response_status INTEGER,
  response_body TEXT,
  success BOOLEAN DEFAULT FALSE,
  delivered_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_webhook_logs_webhook ON webhook_logs(webhook_id);
CREATE INDEX idx_webhook_logs_delivered ON webhook_logs(delivered_at DESC);

-- ============================================
-- 6. SUPPORT TICKETS
-- ============================================

CREATE TABLE IF NOT EXISTS support_tickets (
  id SERIAL PRIMARY KEY,
  user_email VARCHAR(255) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'open',
  priority VARCHAR(20) DEFAULT 'normal',
  assigned_to VARCHAR(255),
  category VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_support_tickets_status ON support_tickets(status);
CREATE INDEX idx_support_tickets_assigned ON support_tickets(assigned_to);
CREATE INDEX idx_support_tickets_user ON support_tickets(user_email);

-- ============================================
-- 7. SUPPORT TICKET REPLIES
-- ============================================

CREATE TABLE IF NOT EXISTS support_ticket_replies (
  id SERIAL PRIMARY KEY,
  ticket_id INTEGER REFERENCES support_tickets(id) ON DELETE CASCADE,
  from_email VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_ticket_replies_ticket ON support_ticket_replies(ticket_id);

-- ============================================
-- 8. API USAGE TRACKING
-- ============================================

CREATE TABLE IF NOT EXISTS api_usage (
  id SERIAL PRIMARY KEY,
  user_email VARCHAR(255),
  endpoint VARCHAR(255),
  requests_today INTEGER DEFAULT 0,
  date DATE DEFAULT CURRENT_DATE,
  UNIQUE(user_email, endpoint, date)
);

CREATE INDEX idx_api_usage_user ON api_usage(user_email);
CREATE INDEX idx_api_usage_date ON api_usage(date DESC);

-- ============================================
-- 9. FEATURE FLAGS
-- ============================================

CREATE TABLE IF NOT EXISTS feature_flags (
  id SERIAL PRIMARY KEY,
  flag_name VARCHAR(100) UNIQUE NOT NULL,
  enabled BOOLEAN DEFAULT FALSE,
  description TEXT,
  updated_by VARCHAR(255),
  updated_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO feature_flags (flag_name, enabled, description) VALUES
  ('referral_program', FALSE, 'Enable referral tracking and commissions'),
  ('usage_based_billing', FALSE, 'Enable pay-per-validation pricing tier'),
  ('sandbox_mode', TRUE, 'Allow test mode for developers'),
  ('admin_approval', FALSE, 'Require admin approval for new applications'),
  ('email_notifications', FALSE, 'Send email notifications for events')
ON CONFLICT (flag_name) DO NOTHING;

-- ============================================
-- 10. REFERRAL SYSTEM (Future)
-- ============================================

CREATE TABLE IF NOT EXISTS referral_codes (
  id SERIAL PRIMARY KEY,
  user_email VARCHAR(255) NOT NULL,
  code VARCHAR(50) UNIQUE NOT NULL,
  total_signups INTEGER DEFAULT 0,
  total_earnings DECIMAL(10,2) DEFAULT 0,
  commission_rate DECIMAL(5,2) DEFAULT 20.00,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS referral_conversions (
  id SERIAL PRIMARY KEY,
  referrer_code VARCHAR(50) NOT NULL,
  referred_email VARCHAR(255) NOT NULL,
  commission_earned DECIMAL(10,2),
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_referral_codes_user ON referral_codes(user_email);
CREATE INDEX idx_referral_conversions_code ON referral_conversions(referrer_code);

-- ============================================
-- 11. CANNED RESPONSES (Support)
-- ============================================

CREATE TABLE IF NOT EXISTS canned_responses (
  id SERIAL PRIMARY KEY,
  title VARCHAR(100) NOT NULL,
  content TEXT NOT NULL,
  category VARCHAR(50),
  usage_count INTEGER DEFAULT 0,
  created_by VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 12. API KEY ENHANCEMENTS
-- ============================================

ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS prefix VARCHAR(10);
ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS last_used_at TIMESTAMP;
ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP;
ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS ip_whitelist TEXT[];
ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS scopes TEXT[] DEFAULT ARRAY['read', 'write'];

-- ============================================
-- 13. DATABASE INDEXES FOR PERFORMANCE
-- ============================================

-- Licenses
CREATE INDEX IF NOT EXISTS idx_licenses_status ON licenses(status);
CREATE INDEX IF NOT EXISTS idx_licenses_app_status ON licenses(app_id, status);
CREATE INDEX IF NOT EXISTS idx_licenses_user_status ON licenses(user_email, status);
CREATE INDEX IF NOT EXISTS idx_licenses_expires ON licenses(expires_at);
CREATE INDEX IF NOT EXISTS idx_licenses_created ON licenses(created_at DESC);

-- Session Logs
CREATE INDEX IF NOT EXISTS idx_session_logs_license ON session_logs(license_key);
CREATE INDEX IF NOT EXISTS idx_session_logs_created ON session_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_session_logs_ip ON session_logs(ip_address);

-- Applications
CREATE INDEX IF NOT EXISTS idx_applications_user ON applications(user_email);
CREATE INDEX IF NOT EXISTS idx_applications_created ON applications(created_at DESC);

-- Blog
CREATE INDEX IF NOT EXISTS idx_blog_slug ON blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_status ON blog_posts(status);
CREATE INDEX IF NOT EXISTS idx_blog_published ON blog_posts(published_at DESC);

-- Changelog
CREATE INDEX IF NOT EXISTS idx_changelog_version ON changelog_entries(version);
CREATE INDEX IF NOT EXISTS idx_changelog_published ON changelog_entries(published_at DESC);

-- ============================================
-- 14. SECURITY VIEWS
-- ============================================

-- Admin dashboard stats view
CREATE OR REPLACE VIEW admin_stats AS
SELECT 
  (SELECT COUNT(*) FROM users) AS total_users,
  (SELECT COUNT(*) FROM applications) AS total_applications,
  (SELECT COUNT(*) FROM licenses) AS total_licenses,
  (SELECT COUNT(*) FROM licenses WHERE status = 'active') AS active_licenses,
  (SELECT COUNT(*) FROM session_logs WHERE DATE(created_at) = CURRENT_DATE) AS validations_today,
  (SELECT COUNT(*) FROM session_logs WHERE DATE(created_at) = CURRENT_DATE AND status != 'success') AS failed_validations_today;

-- Recent activity view
CREATE OR REPLACE VIEW recent_activity AS
SELECT 
  'user_created' AS event_type,
  email AS entity,
  created_at AS timestamp
FROM users
UNION ALL
SELECT 
  'license_created' AS event_type,
  license_key AS entity,
  created_at AS timestamp
FROM licenses
UNION ALL
SELECT 
  'application_created' AS event_type,
  name AS entity,
  created_at AS timestamp
FROM applications
ORDER BY timestamp DESC
LIMIT 100;

-- ============================================
-- 15. SAMPLE ADMIN USER (CHANGE PASSWORD!)
-- ============================================

-- Create sample admin (use your own email)
UPDATE users 
SET role = 'admin', subscription_tier = 'pro'
WHERE email = 'your@email.com';

-- ============================================
-- MIGRATION COMPLETE
-- ============================================

-- Verify migration
DO $$ 
BEGIN
  RAISE NOTICE 'Migration completed successfully!';
  RAISE NOTICE 'Tables created: audit_logs, hwid_blacklist, webhook_logs, support_tickets, api_usage, feature_flags, referral_codes';
  RAISE NOTICE 'User enhancements: role, is_banned, last_login, subscription_tier';
  RAISE NOTICE 'Application enhancements: approval_status, approved_by, approved_at';
  RAISE NOTICE 'API key enhancements: prefix, last_used_at, expires_at, ip_whitelist, scopes';
  RAISE NOTICE 'Indexes created for performance optimization';
  RAISE NOTICE 'Views created: admin_stats, recent_activity';
  RAISE NOTICE '';
  RAISE NOTICE 'IMPORTANT: Update the admin email in line 235 before running!';
  RAISE NOTICE 'IMPORTANT: Set ADMIN_EMAILS environment variable in your backend';
END $$;
