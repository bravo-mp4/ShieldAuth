-- Create default admin user for dashboard login
-- Email: admin@shieldlabs.com
-- Password: admin123
-- Hash generated with bcryptjs rounds=10
INSERT INTO users (email, password_hash, name, role) 
VALUES (
  'admin@shieldlabs.com', 
  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
  'Admin User',
  'admin'
)
ON CONFLICT (email) DO UPDATE 
SET password_hash = '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy';
