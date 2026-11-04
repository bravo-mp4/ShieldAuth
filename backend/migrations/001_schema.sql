-- ShieldAuth schema.

-- Developers who sign in to the dashboard.
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    role VARCHAR(20) NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    is_banned BOOLEAN NOT NULL DEFAULT FALSE,
    last_login TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Software products a developer licenses. owner_email ties them to a user.
CREATE TABLE applications (
    app_id VARCHAR(32) PRIMARY KEY,
    owner_email VARCHAR(255) NOT NULL,
    name VARCHAR(100),
    version VARCHAR(32) DEFAULT '1.0.0',
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_applications_owner ON applications(owner_email);

CREATE TABLE licenses (
    license_key VARCHAR(64) PRIMARY KEY,
    app_id VARCHAR(32) NOT NULL REFERENCES applications(app_id) ON DELETE CASCADE,
    expires_at TIMESTAMP,
    max_hwid_slots INT NOT NULL DEFAULT 1,
    is_banned BOOLEAN NOT NULL DEFAULT FALSE,
    status VARCHAR(20) DEFAULT 'active',
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_licenses_app ON licenses(app_id);
CREATE INDEX idx_licenses_expires ON licenses(expires_at);

-- Machines a license is bound to.
CREATE TABLE hwid_slots (
    id SERIAL PRIMARY KEY,
    license_key VARCHAR(64) NOT NULL REFERENCES licenses(license_key) ON DELETE CASCADE,
    hwid_hash VARCHAR(128) NOT NULL,
    device_name VARCHAR(255),
    ip_address VARCHAR(45),
    last_ip_address VARCHAR(45),
    last_seen TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (license_key, hwid_hash)
);

-- Live client sessions, kept alive by heartbeats.
CREATE TABLE sessions (
    session_id VARCHAR(64) PRIMARY KEY,
    license_key VARCHAR(64) NOT NULL REFERENCES licenses(license_key) ON DELETE CASCADE,
    hwid_hash VARCHAR(128) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    last_heartbeat TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_sessions_license ON sessions(license_key);

-- Every validation attempt, for the dashboard's logs and analytics.
CREATE TABLE validation_logs (
    id SERIAL PRIMARY KEY,
    license_key VARCHAR(64),
    app_id VARCHAR(32) REFERENCES applications(app_id) ON DELETE CASCADE,
    hwid_hash VARCHAR(128),
    ip_address VARCHAR(45),
    result VARCHAR(20) NOT NULL, -- success, invalid, banned, expired, hwid_limit
    error_message TEXT,
    user_agent TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_validation_logs_app_created ON validation_logs(app_id, created_at DESC);
CREATE INDEX idx_validation_logs_license ON validation_logs(license_key);

CREATE TABLE hwid_blacklist (
    id SERIAL PRIMARY KEY,
    hwid VARCHAR(128) UNIQUE NOT NULL,
    reason TEXT,
    blacklisted_by VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Self-service actions from the customer portal (used for the weekly unbind limit).
CREATE TABLE portal_actions (
    id SERIAL PRIMARY KEY,
    license_key VARCHAR(64) REFERENCES licenses(license_key) ON DELETE CASCADE,
    action_type VARCHAR(50) NOT NULL,
    hwid_hash VARCHAR(128),
    ip_address VARCHAR(45),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_portal_actions_license ON portal_actions(license_key, action_type, created_at DESC);

CREATE TABLE webhooks (
    id SERIAL PRIMARY KEY,
    webhook_id VARCHAR(32) UNIQUE NOT NULL,
    owner_email VARCHAR(255) NOT NULL,
    url TEXT NOT NULL,
    events TEXT[] NOT NULL,
    secret VARCHAR(64) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_webhooks_owner ON webhooks(owner_email);

CREATE TABLE webhook_deliveries (
    id SERIAL PRIMARY KEY,
    webhook_id VARCHAR(32) NOT NULL REFERENCES webhooks(webhook_id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL,
    payload JSONB NOT NULL,
    status_code INT,
    response_body TEXT,
    attempt_count INT NOT NULL DEFAULT 1,
    next_retry_at TIMESTAMP,
    delivered_at TIMESTAMP,
    failed_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_webhook_deliveries_webhook ON webhook_deliveries(webhook_id, created_at DESC);
