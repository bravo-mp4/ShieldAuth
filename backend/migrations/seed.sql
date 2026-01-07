-- Create default admin user for dashboard login
-- Email: admin@shieldlabs.com
-- Password: admin123
INSERT INTO users (email, password_hash, name, role) 
VALUES (
  'admin@shieldlabs.com', 
  '$2b$10$rQ5ZpSKX5YdqKJ5xRqYYBOKvKZPXJ5yRqX5YdqKJ5xRqYYBOKvKZP',
  'Admin User',
  'admin'
)
ON CONFLICT (email) DO NOTHING;
