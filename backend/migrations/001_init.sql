-- Users table for dashboard authentication (separate from license system)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'user',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Applications table (owner_email is just a string, not a foreign key)
CREATE TABLE applications (
    app_id VARCHAR(32) PRIMARY KEY,
    app_secret VARCHAR(64) NOT NULL,
    owner_email VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE licenses (
    license_key VARCHAR(64) PRIMARY KEY,
    app_id VARCHAR(32) REFERENCES applications(app_id),
    expires_at TIMESTAMP,
    max_hwid_slots INT DEFAULT 1,
    is_banned BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE hwid_slots (
    id SERIAL PRIMARY KEY,
    license_key VARCHAR(64) REFERENCES licenses(license_key),
    hwid_hash VARCHAR(64) NOT NULL,
    last_seen TIMESTAMP DEFAULT NOW(),
    UNIQUE(license_key, hwid_hash)
);

CREATE TABLE sessions (
    session_id VARCHAR(64) PRIMARY KEY,
    license_key VARCHAR(64) REFERENCES licenses(license_key),
    hwid_hash VARCHAR(64) NOT NULL,
    last_heartbeat TIMESTAMP DEFAULT NOW()
);