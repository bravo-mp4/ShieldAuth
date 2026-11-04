-- Password reset and email verification.

ALTER TABLE users ADD COLUMN email_verified_at TIMESTAMP;
-- Bumped on password change or reset; tokens carrying an older value are rejected.
ALTER TABLE users ADD COLUMN token_version INT NOT NULL DEFAULT 0;

-- One-time links. Only a SHA-256 of the token is stored, so a database
-- leak doesn't hand out working reset links.
CREATE TABLE auth_tokens (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    purpose VARCHAR(20) NOT NULL CHECK (purpose IN ('password_reset', 'email_verify')),
    token_hash CHAR(64) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_auth_tokens_user ON auth_tokens(user_id, purpose);
