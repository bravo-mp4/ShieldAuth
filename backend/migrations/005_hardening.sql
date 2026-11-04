-- Columns and indexes the API relies on that earlier migrations missed.

-- Applications get a real name and version instead of showing the owner's email.
ALTER TABLE applications ADD COLUMN IF NOT EXISTS name VARCHAR(100);
ALTER TABLE applications ADD COLUMN IF NOT EXISTS version VARCHAR(32) DEFAULT '1.0.0';

-- Sessions: when they started, and fast lookup by license for ban/expire.
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();
CREATE INDEX IF NOT EXISTS idx_sessions_license ON sessions(license_key);
CREATE INDEX IF NOT EXISTS idx_sessions_heartbeat ON sessions(last_heartbeat);

-- The weekly self-service unbind limit is checked per license.
CREATE INDEX IF NOT EXISTS idx_portal_actions_license_type ON portal_actions(license_key, action_type, created_at DESC);
