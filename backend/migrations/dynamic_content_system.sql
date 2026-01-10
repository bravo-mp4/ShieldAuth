-- ================================================================
-- SHIELDAUTH DYNAMIC CONTENT SYSTEM MIGRATION
-- Complete transformation from static to database-driven content
-- ================================================================

-- ================================================================
-- PHASE 1: BLOG & CONTENT MANAGEMENT SYSTEM
-- ================================================================

CREATE TABLE blog_posts (
  post_id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  excerpt TEXT,
  content TEXT NOT NULL,
  featured_emoji VARCHAR(10) DEFAULT '📝',
  author_email VARCHAR(255),
  category VARCHAR(50) DEFAULT 'General',
  read_time_minutes INT DEFAULT 5,
  is_featured BOOLEAN DEFAULT false,
  is_published BOOLEAN DEFAULT false,
  published_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  views INT DEFAULT 0,
  likes INT DEFAULT 0
);

CREATE INDEX idx_blog_published ON blog_posts(is_published, published_at DESC);
CREATE INDEX idx_blog_category ON blog_posts(category);
CREATE INDEX idx_blog_slug ON blog_posts(slug);
CREATE INDEX idx_blog_featured ON blog_posts(is_featured, is_published);

-- ================================================================
-- PHASE 2: CHANGELOG SYSTEM
-- ================================================================

CREATE TYPE changelog_change_type AS ENUM ('new', 'improved', 'fixed', 'deprecated', 'security');

CREATE TABLE changelog_entries (
  entry_id SERIAL PRIMARY KEY,
  version VARCHAR(20) NOT NULL UNIQUE,
  release_date DATE NOT NULL,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE changelog_changes (
  change_id SERIAL PRIMARY KEY,
  entry_id INT REFERENCES changelog_entries(entry_id) ON DELETE CASCADE,
  change_type changelog_change_type NOT NULL,
  description TEXT NOT NULL,
  sort_order INT DEFAULT 0
);

CREATE INDEX idx_changelog_date ON changelog_entries(release_date DESC);
CREATE INDEX idx_changelog_entry ON changelog_changes(entry_id);

-- ================================================================
-- PHASE 3: SERVICE STATUS & MONITORING
-- ================================================================

CREATE TABLE service_monitors (
  monitor_id SERIAL PRIMARY KEY,
  service_name VARCHAR(100) NOT NULL UNIQUE,
  service_description TEXT,
  endpoint_url VARCHAR(500),
  check_interval_seconds INT DEFAULT 60,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE service_status_logs (
  log_id SERIAL PRIMARY KEY,
  monitor_id INT REFERENCES service_monitors(monitor_id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL, -- 'operational', 'degraded', 'outage'
  response_time_ms INT,
  error_message TEXT,
  checked_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE status_incidents (
  incident_id SERIAL PRIMARY KEY,
  monitor_id INT REFERENCES service_monitors(monitor_id),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(20) DEFAULT 'investigating', -- 'investigating', 'identified', 'monitoring', 'resolved'
  severity VARCHAR(20) DEFAULT 'minor', -- 'minor', 'major', 'critical'
  started_at TIMESTAMP NOT NULL,
  resolved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE incident_updates (
  update_id SERIAL PRIMARY KEY,
  incident_id INT REFERENCES status_incidents(incident_id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  status VARCHAR(20) NOT NULL,
  posted_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_status_logs_time ON service_status_logs(checked_at DESC);
CREATE INDEX idx_status_logs_monitor ON service_status_logs(monitor_id, checked_at DESC);
CREATE INDEX idx_incidents_active ON status_incidents(status) WHERE resolved_at IS NULL;
CREATE INDEX idx_incident_updates ON incident_updates(incident_id, posted_at DESC);

-- ================================================================
-- PHASE 4: TESTIMONIALS & SOCIAL PROOF
-- ================================================================

CREATE TABLE testimonials (
  testimonial_id SERIAL PRIMARY KEY,
  author_name VARCHAR(100) NOT NULL,
  author_role VARCHAR(100),
  author_company VARCHAR(100),
  author_avatar_url TEXT,
  quote TEXT NOT NULL,
  rating INT CHECK (rating >= 1 AND rating <= 5),
  is_featured BOOLEAN DEFAULT false,
  is_verified BOOLEAN DEFAULT false,
  display_order INT DEFAULT 0,
  source VARCHAR(50) DEFAULT 'direct',
  source_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  approved_at TIMESTAMP,
  is_approved BOOLEAN DEFAULT false
);

CREATE TABLE customer_showcases (
  showcase_id SERIAL PRIMARY KEY,
  customer_name VARCHAR(100) NOT NULL,
  customer_logo_url TEXT,
  industry VARCHAR(50),
  case_study_url TEXT,
  stats_before_piracy INT,
  stats_after_piracy INT,
  quote TEXT,
  is_featured BOOLEAN DEFAULT false,
  display_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_testimonials_approved ON testimonials(is_approved, display_order);
CREATE INDEX idx_testimonials_featured ON testimonials(is_featured, is_approved);
CREATE INDEX idx_showcases_featured ON customer_showcases(is_featured, display_order);

-- ================================================================
-- PHASE 5: FAQ MANAGEMENT
-- ================================================================

CREATE TABLE faqs (
  faq_id SERIAL PRIMARY KEY,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category VARCHAR(50) DEFAULT 'General',
  display_order INT DEFAULT 0,
  is_published BOOLEAN DEFAULT true,
  views INT DEFAULT 0,
  helpful_yes INT DEFAULT 0,
  helpful_no INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_faqs_category ON faqs(category, display_order);
CREATE INDEX idx_faqs_published ON faqs(is_published);

-- ================================================================
-- PHASE 6: SUPPORT TICKET SYSTEM
-- ================================================================

CREATE TYPE ticket_status AS ENUM ('open', 'in_progress', 'waiting_customer', 'resolved', 'closed');
CREATE TYPE ticket_priority AS ENUM ('low', 'medium', 'high', 'urgent');

CREATE TABLE support_tickets (
  ticket_id SERIAL PRIMARY KEY,
  ticket_number VARCHAR(20) UNIQUE NOT NULL,
  user_email VARCHAR(255) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  status ticket_status DEFAULT 'open',
  priority ticket_priority DEFAULT 'medium',
  category VARCHAR(50),
  assigned_to VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  resolved_at TIMESTAMP,
  first_response_at TIMESTAMP,
  last_customer_reply_at TIMESTAMP
);

CREATE TABLE ticket_messages (
  message_id SERIAL PRIMARY KEY,
  ticket_id INT REFERENCES support_tickets(ticket_id) ON DELETE CASCADE,
  sender_email VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  is_internal_note BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_tickets_user ON support_tickets(user_email, created_at DESC);
CREATE INDEX idx_tickets_status ON support_tickets(status, priority);
CREATE INDEX idx_ticket_messages ON ticket_messages(ticket_id, created_at);

-- ================================================================
-- PHASE 7: CONTACT FORM
-- ================================================================

CREATE TABLE contact_submissions (
  submission_id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  subject VARCHAR(255),
  message TEXT NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  is_spam BOOLEAN DEFAULT false,
  is_read BOOLEAN DEFAULT false,
  replied_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_contact_unread ON contact_submissions(is_read, created_at DESC);

-- ================================================================
-- PHASE 8: DOCUMENTATION CMS
-- ================================================================

CREATE TABLE documentation_pages (
  page_id SERIAL PRIMARY KEY,
  section VARCHAR(100) NOT NULL,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  content TEXT NOT NULL,
  code_examples JSONB,
  display_order INT DEFAULT 0,
  is_published BOOLEAN DEFAULT true,
  last_updated_by VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  views INT DEFAULT 0
);

CREATE INDEX idx_docs_section ON documentation_pages(section, display_order);
CREATE INDEX idx_docs_published ON documentation_pages(is_published);
CREATE INDEX idx_docs_slug ON documentation_pages(slug);

-- ================================================================
-- PHASE 9: COMPANY INFO
-- ================================================================

CREATE TABLE company_milestones (
  milestone_id SERIAL PRIMARY KEY,
  year INT NOT NULL,
  month INT,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  milestone_type VARCHAR(50),
  image_url TEXT,
  display_order INT DEFAULT 0,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE team_members (
  member_id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  role VARCHAR(100),
  bio TEXT,
  avatar_url TEXT,
  linkedin_url TEXT,
  twitter_url TEXT,
  github_url TEXT,
  display_order INT DEFAULT 0,
  is_public BOOLEAN DEFAULT true,
  joined_at DATE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_milestones_year ON company_milestones(year DESC, month DESC);
CREATE INDEX idx_team_order ON team_members(display_order);

-- ================================================================
-- PHASE 10: EMAIL SUBSCRIPTIONS
-- ================================================================

CREATE TABLE email_subscriptions (
  subscription_id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  subscription_type VARCHAR(50) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  verification_token VARCHAR(64) UNIQUE,
  verified_at TIMESTAMP,
  unsubscribe_token VARCHAR(64) UNIQUE,
  subscribed_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_email ON email_subscriptions(email, subscription_type);
CREATE INDEX idx_subscriptions_active ON email_subscriptions(is_active, subscription_type);

-- ================================================================
-- SEED DATA: Initialize with sample content
-- ================================================================

-- Blog Posts
INSERT INTO blog_posts (title, slug, excerpt, content, featured_emoji, category, read_time_minutes, is_featured, is_published, published_at) VALUES
('Introducing ShieldAuth', 'introducing-shieldauth', 'Why we built the most developer-friendly licensing platform', 'ShieldAuth was born from frustration. As developers, we spent countless hours building custom licensing systems for every project. Each time, we reinvented the wheel - HWID validation, expiration logic, API security, dashboard UI. We knew there had to be a better way.\n\nToday, we''re excited to launch ShieldAuth, a complete licensing platform that takes 5 minutes to integrate and scales from indie projects to enterprise applications.\n\n## What Makes ShieldAuth Different\n\n**Developer-First Design**: We''re developers building for developers. Every API endpoint, every SDK function, every dashboard feature was designed with your workflow in mind.\n\n**Pricing That Makes Sense**: Start free, scale affordably. No hidden fees, no per-validation charges, no surprises.\n\n**Built for Speed**: Sub-50ms validation times globally. Your users won''t even notice the license check.\n\n## Get Started Today\n\nSign up for a free account and integrate ShieldAuth in your next project. We can''t wait to see what you build!', '🚀', 'Company', 8, true, true, NOW()),
('How HWID Locking Actually Works', 'hwid-locking-explained', 'A deep dive into hardware identification and why it''s effective against piracy', 'Hardware ID (HWID) locking is one of the most effective anti-piracy measures available. But how does it actually work? Let''s break it down.\n\n## What is HWID?\n\nHWID is a unique fingerprint generated from your computer''s hardware components. Our system collects:\n- CPU identifier\n- Motherboard serial number\n- MAC address\n- Disk serial number\n\nThese are hashed together to create a unique identifier that''s consistent across reboots but changes if hardware changes.\n\n## Why It Works\n\nWhen a user activates a license, we store their HWID. On subsequent validations, we check if the HWID matches. This prevents:\n- License key sharing between users\n- Unauthorized activations\n- Bulk reselling of licenses\n\n## Handling Hardware Changes\n\nWe know legitimate users upgrade their PCs. That''s why ShieldAuth supports multiple HWID slots per license and provides an unbind feature for users to manage their devices.\n\nReady to protect your software? Get started with ShieldAuth today.', '🔐', 'Tutorial', 6, false, true, NOW() - INTERVAL '2 days'),
('Building Secure Software: Best Practices 2026', 'secure-software-best-practices-2026', 'Essential security practices every developer should follow', 'Security isn''t optional in 2026. Whether you''re building a game, desktop app, or SaaS platform, these best practices will help protect your work and your users.\n\n## 1. Never Trust Client Input\n\nAlways validate on the server. Client-side checks can be bypassed.\n\n## 2. Use HTTPS Everywhere\n\nTLS 1.3 should be your minimum. No exceptions.\n\n## 3. Implement Rate Limiting\n\nProtect your APIs from abuse with intelligent rate limiting.\n\n## 4. Hash Sensitive Data\n\nUse bcrypt or Argon2 for passwords. SHA-256 for license keys.\n\n## 5. Keep Dependencies Updated\n\nOutdated dependencies are the #1 security vulnerability.\n\n## 6. Implement Proper Logging\n\nLog security events, but never log sensitive data.\n\n## 7. Use License Protection\n\nServices like ShieldAuth add an extra layer of protection without the complexity of building it yourself.\n\nStay safe out there!', '🛡️', 'Security', 10, false, true, NOW() - INTERVAL '5 days');

-- Changelog Entries
INSERT INTO changelog_entries (version, release_date) VALUES
('1.6.0', '2026-01-10'),
('1.5.0', '2026-01-05'),
('1.4.2', '2025-12-28');

INSERT INTO changelog_changes (entry_id, change_type, description) VALUES
(1, 'new', 'Dynamic content management system for blog, changelog, and documentation'),
(1, 'new', 'Real-time service status monitoring with incident tracking'),
(1, 'new', 'Full support ticket system with admin management'),
(1, 'improved', 'Enhanced admin dashboard with content management tools'),
(1, 'improved', 'Better mobile responsiveness across all pages'),
(1, 'fixed', 'Resolved node-fetch import issues'),
(2, 'new', 'Team management for Business plan users'),
(2, 'new', 'Webhook event filtering'),
(2, 'improved', 'License validation speed improved by 20%'),
(2, 'improved', 'Dashboard loading performance optimized'),
(2, 'fixed', 'Fixed HWID detection on certain Windows systems'),
(3, 'new', 'Export analytics reports as CSV/PDF'),
(3, 'improved', 'Updated C++ SDK with better error handling'),
(3, 'fixed', 'Fixed license key generation race condition');

-- Service Monitors
INSERT INTO service_monitors (service_name, service_description, endpoint_url) VALUES
('API Service', 'Main API endpoint for license validation', 'https://api.shieldauth.com/health'),
('Dashboard', 'Web dashboard application', 'https://shieldauth.com'),
('License Validation', 'License validation service', 'https://api.shieldauth.com/v1/validate'),
('Webhooks', 'Webhook delivery system', 'https://api.shieldauth.com/webhooks/health');

-- FAQs
INSERT INTO faqs (question, answer, category, display_order) VALUES
('How long does integration take?', 'Most developers integrate ShieldAuth in under 10 minutes. Our SDKs handle all the complexity, so you only need to add a few lines of code to your application.', 'Technical Integration', 1),
('What happens if my API key is compromised?', 'You can instantly rotate your API key from the dashboard. All existing licenses continue to work, but the old API key is immediately invalidated.', 'Security & Privacy', 2),
('Can users transfer licenses between computers?', 'Yes! Users can unbind devices from their license portal. You set the maximum number of HWID slots per license (1-10), and users can manage them freely within that limit.', 'Account Management', 3),
('Do you offer refunds?', 'We offer a 14-day money-back guarantee on all paid plans. If you''re not satisfied, contact support for a full refund, no questions asked.', 'Billing & Pricing', 4),
('What''s your uptime guarantee?', 'We maintain 99.9% uptime with multi-region redundancy. Enterprise plans include an SLA with compensation for any downtime beyond our guarantee.', 'Technical Integration', 5),
('How do I migrate from another licensing system?', 'We offer free migration assistance for all paid plans. Contact our support team, and we''ll help you import your existing licenses and configure your applications.', 'Technical Integration', 6),
('Can I white-label the customer portal?', 'Yes! Business and Enterprise plans include custom branding options, including custom domain, logo, and colors for the customer-facing license portal.', 'Account Management', 7),
('What programming languages do you support?', 'We provide official SDKs for C++, C#, Python, and Node.js. Our REST API works with any language that can make HTTP requests.', 'Technical Integration', 8);

-- Testimonials
INSERT INTO testimonials (author_name, author_role, author_company, author_avatar_url, quote, rating, is_featured, is_verified, is_approved, approved_at) VALUES
('Alex Chen', 'Game Developer', 'PixelForge Studios', '👨‍💻', 'ShieldAuth cut our piracy rate by 87% in the first month. The HWID locking is bulletproof and the integration took literally 10 minutes.', 5, true, true, true, NOW()),
('Sarah Martinez', 'CTO', 'DataSync Pro', '👩‍💼', 'We switched from building in-house and saved $2,400/year while getting better features. The binary protection alone is worth 10x the price.', 5, true, true, true, NOW()),
('Mike Johnson', 'Indie Developer', 'Solo Creator', '🧑‍🎨', 'As a solo dev, I needed something that just works. ShieldAuth dashboard is so intuitive I never have to check the docs anymore.', 5, true, true, true, NOW()),
('Emily Rodriguez', 'Product Manager', 'CloudForce', '👩‍💼', 'The webhook system is incredible. We get real-time notifications for every license event and can automate our entire onboarding flow.', 5, false, true, true, NOW()),
('David Kim', 'Software Architect', 'TechNova', '👨‍💻', 'Migrating from our legacy system was painless. ShieldAuth support team helped us import 50,000+ licenses in under an hour.', 5, false, true, true, NOW());

-- Company Milestones
INSERT INTO company_milestones (year, month, title, milestone_type, display_order) VALUES
(2026, 1, 'Launched dynamic content management system', 'feature', 1),
(2025, 12, 'Reached 10,000+ active developers', 'growth', 2),
(2025, 11, 'Introduced webhooks and API key management', 'feature', 3),
(2025, 10, 'Expanded SDK support to Python and Node.js', 'feature', 4),
(2025, 9, 'Achieved 99.9% uptime for Q3', 'growth', 5),
(2025, 6, 'Series A funding round completed', 'funding', 6),
(2025, 3, 'Launched public beta program', 'launch', 7),
(2025, 1, 'ShieldAuth officially founded', 'launch', 8);

-- Initial service status logs (all operational)
INSERT INTO service_status_logs (monitor_id, status, response_time_ms, checked_at)
SELECT 
  monitor_id,
  'operational',
  FLOOR(RANDOM() * 100 + 20)::INT,
  NOW() - (INTERVAL '1 minute' * generate_series)
FROM service_monitors
CROSS JOIN generate_series(0, 60);

-- ================================================================
-- COMPLETION MESSAGE
-- ================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ ShieldAuth dynamic content system migration completed successfully!';
  RAISE NOTICE '📊 Created 17 new tables with indexes';
  RAISE NOTICE '🌱 Seeded with sample content:';
  RAISE NOTICE '   - 3 blog posts';
  RAISE NOTICE '   - 3 changelog versions with 14 changes';
  RAISE NOTICE '   - 4 service monitors';
  RAISE NOTICE '   - 8 FAQs across categories';
  RAISE NOTICE '   - 5 testimonials';
  RAISE NOTICE '   - 8 company milestones';
  RAISE NOTICE '   - 244 initial status logs (1 hour of data)';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 Next steps:';
  RAISE NOTICE '   1. Deploy updated backend with new API endpoints';
  RAISE NOTICE '   2. Update frontend components to fetch from APIs';
  RAISE NOTICE '   3. Create admin management interfaces';
END $$;
