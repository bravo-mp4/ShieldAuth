-- Advanced Features Migration
-- This adds all tables needed for the advanced features

-- Add notes field to licenses table
ALTER TABLE licenses ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE licenses ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Add device_name to hwid_slots for customer portal
ALTER TABLE hwid_slots ADD COLUMN IF NOT EXISTS device_name VARCHAR(255);
ALTER TABLE hwid_slots ADD COLUMN IF NOT EXISTS ip_address VARCHAR(45);
ALTER TABLE hwid_slots ADD COLUMN IF NOT EXISTS last_ip_address VARCHAR(45);
ALTER TABLE hwid_slots ADD COLUMN IF NOT EXISTS unbind_count INT DEFAULT 0;
ALTER TABLE hwid_slots ADD COLUMN IF NOT EXISTS last_unbind_at TIMESTAMP;

-- Validation logs table (for logging system)
CREATE TABLE IF NOT EXISTS validation_logs (
    id SERIAL PRIMARY KEY,
    license_key VARCHAR(64),
    app_id VARCHAR(32) REFERENCES applications(app_id),
    hwid_hash VARCHAR(64),
    ip_address VARCHAR(45),
    result VARCHAR(20) NOT NULL, -- 'success', 'expired', 'banned', 'invalid', 'hwid_mismatch', 'hwid_limit'
    error_message TEXT,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_validation_logs_license ON validation_logs(license_key);
CREATE INDEX IF NOT EXISTS idx_validation_logs_app ON validation_logs(app_id);
CREATE INDEX IF NOT EXISTS idx_validation_logs_created ON validation_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_validation_logs_result ON validation_logs(result);

-- API request analytics table (for per-app analytics)
CREATE TABLE IF NOT EXISTS api_analytics (
    id SERIAL PRIMARY KEY,
    app_id VARCHAR(32) REFERENCES applications(app_id),
    endpoint VARCHAR(100) NOT NULL,
    method VARCHAR(10) NOT NULL,
    status_code INT NOT NULL,
    response_time_ms INT,
    ip_address VARCHAR(45),
    country_code VARCHAR(2),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_api_analytics_app ON api_analytics(app_id);
CREATE INDEX IF NOT EXISTS idx_api_analytics_created ON api_analytics(created_at DESC);

-- Webhooks table
CREATE TABLE IF NOT EXISTS webhooks (
    id SERIAL PRIMARY KEY,
    webhook_id VARCHAR(32) UNIQUE NOT NULL,
    owner_email VARCHAR(255) NOT NULL,
    url TEXT NOT NULL,
    events TEXT[] NOT NULL, -- ['license.created', 'license.expired', etc]
    secret VARCHAR(64),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_webhooks_owner ON webhooks(owner_email);

-- Webhook delivery logs
CREATE TABLE IF NOT EXISTS webhook_deliveries (
    id SERIAL PRIMARY KEY,
    webhook_id VARCHAR(32) REFERENCES webhooks(webhook_id),
    event_type VARCHAR(50) NOT NULL,
    payload JSONB NOT NULL,
    status_code INT,
    response_body TEXT,
    attempt_count INT DEFAULT 1,
    next_retry_at TIMESTAMP,
    delivered_at TIMESTAMP,
    failed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_webhook ON webhook_deliveries(webhook_id);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_created ON webhook_deliveries(created_at DESC);

-- API Keys table (for scoped permissions)
CREATE TABLE IF NOT EXISTS api_keys (
    id SERIAL PRIMARY KEY,
    key_id VARCHAR(32) UNIQUE NOT NULL,
    key_hash VARCHAR(128) NOT NULL,
    owner_email VARCHAR(255) NOT NULL,
    app_id VARCHAR(32) REFERENCES applications(app_id),
    name VARCHAR(100) NOT NULL,
    scopes TEXT[] NOT NULL, -- ['license:read', 'license:write', 'analytics:read', etc]
    last_used_at TIMESTAMP,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_api_keys_owner ON api_keys(owner_email);
CREATE INDEX IF NOT EXISTS idx_api_keys_app ON api_keys(app_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON api_keys(key_hash);

-- Fraud detection table
CREATE TABLE IF NOT EXISTS fraud_alerts (
    id SERIAL PRIMARY KEY,
    license_key VARCHAR(64) REFERENCES licenses(license_key),
    alert_type VARCHAR(50) NOT NULL, -- 'hwid_spoofing', 'geo_impossible', 'rapid_hwid_change', 'sharing_detected'
    severity VARCHAR(20) NOT NULL, -- 'low', 'medium', 'high', 'critical'
    details JSONB NOT NULL,
    trust_score DECIMAL(3,2), -- 0.00 to 1.00
    is_resolved BOOLEAN DEFAULT FALSE,
    auto_banned BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fraud_alerts_license ON fraud_alerts(license_key);
CREATE INDEX IF NOT EXISTS idx_fraud_alerts_created ON fraud_alerts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_fraud_alerts_severity ON fraud_alerts(severity);

-- License templates table
CREATE TABLE IF NOT EXISTS license_templates (
    id SERIAL PRIMARY KEY,
    template_id VARCHAR(32) UNIQUE NOT NULL,
    owner_email VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    days_valid INT NOT NULL,
    max_hwid_slots INT DEFAULT 1,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_license_templates_owner ON license_templates(owner_email);

-- Public portal access logs (rate limiting for self-service unbind)
CREATE TABLE IF NOT EXISTS portal_actions (
    id SERIAL PRIMARY KEY,
    license_key VARCHAR(64) REFERENCES licenses(license_key),
    action_type VARCHAR(50) NOT NULL, -- 'unbind', 'view'
    hwid_hash VARCHAR(64),
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_portal_actions_license ON portal_actions(license_key);
CREATE INDEX IF NOT EXISTS idx_portal_actions_created ON portal_actions(created_at DESC);
