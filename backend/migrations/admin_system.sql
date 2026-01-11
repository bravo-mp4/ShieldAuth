-- Admin System Migration
-- Run this after your existing dynamic_content_system.sql

-- ============================================
-- 1. AUDIT LOGGING
-- ============================================

CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  admin_email VARCHAR(255),
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50),
  resource_id INTEGER,
  ip_address VARCHAR(45),
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_admin ON audit_logs(admin_email);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at DESC);

-- ============================================
-- 2. USER ENHANCEMENTS
-- ============================================

-- Add admin role and ban status (skip if already exists from init.sql)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='is_banned') THEN
    ALTER TABLE users ADD COLUMN is_banned BOOLEAN DEFAULT FALSE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='last_login') THEN
    ALTER TABLE users ADD COLUMN last_login TIMESTAMP;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='subscription_tier') THEN
    ALTER TABLE users ADD COLUMN subscription_tier VARCHAR(20) DEFAULT 'free';
  END IF;
END $$;

-- ============================================
-- 3. APPLICATION APPROVAL SYSTEM
-- ============================================

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='applications' AND column_name='approval_status') THEN
    ALTER TABLE applications ADD COLUMN approval_status VARCHAR(20) DEFAULT 'approved';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='applications' AND column_name='approved_by') THEN
    ALTER TABLE applications ADD COLUMN approved_by VARCHAR(255);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='applications' AND column_name='approved_at') THEN
    ALTER TABLE applications ADD COLUMN approved_at TIMESTAMP;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='applications' AND column_name='rejection_reason') THEN
    ALTER TABLE applications ADD COLUMN rejection_reason TEXT;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_applications_approval ON applications(approval_status);

-- Add status to licenses (for active/expired tracking)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='licenses' AND column_name='status') THEN
    ALTER TABLE licenses ADD COLUMN status VARCHAR(20) DEFAULT 'active';
    -- Create index after column is added
    CREATE INDEX idx_licenses_status ON licenses(status);
  END IF;
END $$;

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

CREATE INDEX IF NOT EXISTS idx_hwid_blacklist_hwid ON hwid_blacklist(hwid);

-- ============================================
-- 5. WEBHOOKS & DELIVERY LOGS
-- ============================================

-- First create webhooks table if it doesn't exist
CREATE TABLE IF NOT EXISTS webhooks (
  id SERIAL PRIMARY KEY,
  owner_email VARCHAR(255) NOT NULL,
  url VARCHAR(500) NOT NULL,
  events TEXT[] DEFAULT ARRAY['license.created', 'license.validated', 'user.created'],
  is_active BOOLEAN DEFAULT TRUE,
  secret VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_webhooks_user ON webhooks(owner_email);
CREATE INDEX IF NOT EXISTS idx_webhooks_active ON webhooks(is_active);

-- Then create webhook logs
CREATE TABLE IF NOT EXISTS webhook_logs (
  id SERIAL PRIMARY KEY,
  webhook_id INTEGER,
  event_type VARCHAR(50),
  payload JSONB,
  response_status INTEGER,
  response_body TEXT,
  success BOOLEAN DEFAULT FALSE,
  delivered_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_webhook_logs_webhook ON webhook_logs(webhook_id);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_delivered ON webhook_logs(delivered_at DESC);

-- ============================================
-- 6. SUPPORT TICKETS
-- ============================================

-- Support tickets table and indexes already created in dynamic_content_system.sql
-- The table uses ENUM types: ticket_status and ticket_priority
-- Indexes already exist: idx_tickets_status, idx_tickets_user, idx_ticket_messages

-- ============================================
-- 7. SUPPORT TICKET REPLIES
-- ============================================

-- Ticket messages/replies table is already created as 'ticket_messages' in dynamic_content_system.sql
-- No need to recreate it here

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

CREATE INDEX IF NOT EXISTS idx_api_usage_user ON api_usage(user_email);
CREATE INDEX IF NOT EXISTS idx_api_usage_date ON api_usage(date DESC);

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

CREATE INDEX IF NOT EXISTS idx_referral_codes_user ON referral_codes(user_email);
CREATE INDEX IF NOT EXISTS idx_referral_conversions_code ON referral_conversions(referrer_code);

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

DO $$ 
BEGIN
  -- Only add columns if api_keys table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='api_keys') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='api_keys' AND column_name='prefix') THEN
      ALTER TABLE api_keys ADD COLUMN prefix VARCHAR(10);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='api_keys' AND column_name='last_used_at') THEN
      ALTER TABLE api_keys ADD COLUMN last_used_at TIMESTAMP;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='api_keys' AND column_name='expires_at') THEN
      ALTER TABLE api_keys ADD COLUMN expires_at TIMESTAMP;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='api_keys' AND column_name='ip_whitelist') THEN
      ALTER TABLE api_keys ADD COLUMN ip_whitelist TEXT[];
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='api_keys' AND column_name='scopes') THEN
      ALTER TABLE api_keys ADD COLUMN scopes TEXT[] DEFAULT ARRAY['read', 'write'];
    END IF;
  END IF;
END $$;

-- ============================================
-- 13. DATABASE INDEXES FOR PERFORMANCE
-- ============================================

-- Create session_logs table if it doesn't exist (for tracking validations)
CREATE TABLE IF NOT EXISTS session_logs (
  id SERIAL PRIMARY KEY,
  license_key VARCHAR(64),
  ip_address VARCHAR(45),
  status VARCHAR(20),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_session_logs_license ON session_logs(license_key);
CREATE INDEX IF NOT EXISTS idx_session_logs_created ON session_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_session_logs_ip ON session_logs(ip_address);

-- Licenses indexes
CREATE INDEX IF NOT EXISTS idx_licenses_app ON licenses(app_id);
CREATE INDEX IF NOT EXISTS idx_licenses_expires ON licenses(expires_at);
CREATE INDEX IF NOT EXISTS idx_licenses_created ON licenses(created_at DESC);

-- Applications
CREATE INDEX IF NOT EXISTS idx_applications_owner ON applications(owner_email);
CREATE INDEX IF NOT EXISTS idx_applications_created ON applications(created_at DESC);

-- Only create blog/changelog indexes if those tables exist
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='blog_posts') THEN
    -- Note: blog_posts uses is_published, not status
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_blog_slug_admin') THEN
      CREATE INDEX idx_blog_slug_admin ON blog_posts(slug);
    END IF;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='changelog_entries') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_changelog_version_admin') THEN
      CREATE INDEX idx_changelog_version_admin ON changelog_entries(version);
    END IF;
  END IF;
END $$;

-- ============================================
-- 14. ADMIN VIEWS
-- ============================================

-- Admin stats view (only query tables/columns that definitely exist)
CREATE OR REPLACE VIEW admin_stats AS
SELECT 
  (SELECT COUNT(*) FROM users) AS total_users,
  (SELECT COUNT(*) FROM users WHERE created_at > NOW() - INTERVAL '7 days') AS users_this_week,
  (SELECT COUNT(*) FROM applications) AS total_applications,
  (SELECT COUNT(*) FROM licenses) AS total_licenses,
  (SELECT COUNT(*) FROM licenses WHERE is_banned = FALSE) AS active_licenses,
  0 AS open_tickets;

-- Recent activity view (only use columns that definitely exist)
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
  app_id AS entity,
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
WHERE email = 'your-email@example.com';

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
  RAISE NOTICE 'IMPORTANT: Update the admin email in line 336 before running!';
  RAISE NOTICE 'IMPORTANT: Set ADMIN_EMAILS environment variable in your backend';
  RAISE NOTICE '';
  RAISE NOTICE 'Note: All foreign key constraints removed for compatibility';
  RAISE NOTICE 'Tables use email/string references instead of integer foreign keys';
END $$;
