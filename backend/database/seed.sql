-- Optional seed data - run after schema.sql + procedures.sql
USE ecommerce_db;

-- Default admin login: admin@example.com / Admin@123
-- (password below is a bcrypt hash of "Admin@123" - regenerate in production!)
INSERT INTO users (name, email, password, phone, role, status)
VALUES ('Super Admin', 'admin@example.com', '$2a$10$CwTycUXWue0Thq9StjUM0uJ8Q1i8Jbh3v5cQ0ZQe3XmM4l1qzFq0S', '9999999999', 'admin', 'active')
ON DUPLICATE KEY UPDATE email = email;

INSERT INTO categories (name, slug, status) VALUES
('Electronics', 'electronics-00001', 'active'),
('Fashion', 'fashion-00002', 'active'),
('Home & Kitchen', 'home-kitchen-00003', 'active');
