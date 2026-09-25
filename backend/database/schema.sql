-- ============================================================
-- Ecommerce Database Schema (MySQL 8+)
-- ============================================================
CREATE DATABASE IF NOT EXISTS ecommerce_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE ecommerce_db;

-- ---------------- Users (admin + customers share one table) ----------------
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  phone VARCHAR(20) UNIQUE,              -- one account per mobile number
  role ENUM('admin','staff','customer') NOT NULL DEFAULT 'customer',
  status ENUM('active','inactive','blocked') NOT NULL DEFAULT 'active',
  reset_token VARCHAR(255) NULL,
  reset_token_expires DATETIME NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ---------------- Categories ----------------
CREATE TABLE IF NOT EXISTS categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL UNIQUE,
  slug VARCHAR(180) NOT NULL UNIQUE,
  image VARCHAR(255),
  status ENUM('active','inactive') NOT NULL DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ---------------- Subcategories ----------------
CREATE TABLE IF NOT EXISTS subcategories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  category_id INT NOT NULL,
  name VARCHAR(150) NOT NULL,
  slug VARCHAR(180) NOT NULL UNIQUE,
  image VARCHAR(255),
  status ENUM('active','inactive') NOT NULL DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_subcategory_name (category_id, name),
  CONSTRAINT fk_subcat_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------- Products ----------------
CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  category_id INT NOT NULL,
  subcategory_id INT NULL,
  name VARCHAR(200) NOT NULL UNIQUE,
  slug VARCHAR(230) NOT NULL UNIQUE,
  sku VARCHAR(80) UNIQUE,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  discount_price DECIMAL(10,2) NULL,
  stock INT NOT NULL DEFAULT 0,
  status ENUM('active','inactive','out_of_stock') NOT NULL DEFAULT 'active',
  highlight ENUM('none','featured','current') NOT NULL DEFAULT 'none', -- home page section
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_product_category FOREIGN KEY (category_id) REFERENCES categories(id),
  CONSTRAINT fk_product_subcategory FOREIGN KEY (subcategory_id) REFERENCES subcategories(id),
  FULLTEXT KEY ft_product_search (name, description)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS product_images (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  image VARCHAR(255) NOT NULL,
  is_primary BOOLEAN DEFAULT FALSE,
  CONSTRAINT fk_image_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------- Cart (persisted server-side per user, optional if frontend uses local cart) ----------------
CREATE TABLE IF NOT EXISTS cart_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_cart_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_cart_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  UNIQUE KEY uniq_user_product (user_id, product_id)
) ENGINE=InnoDB;

-- ---------------- Payment methods ----------------
-- Payment options shown on the website Payment page, managed by admin.
-- `code` matches orders.payment_method, so only these five values are allowed.
CREATE TABLE IF NOT EXISTS payment_methods (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code ENUM('cod','card','upi','netbanking','wallet') NOT NULL UNIQUE,
  name VARCHAR(80) NOT NULL,
  description VARCHAR(160) NULL,
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Default data (INSERT IGNORE: re-running keeps any changes the admin already made)
INSERT IGNORE INTO payment_methods (code, name, description, sort_order, is_active, is_default) VALUES
  ('cod',        'Cash on Delivery',    'Pay when your order arrives',          1, TRUE,  TRUE),
  ('upi',        'UPI',                 'Google Pay, PhonePe, Paytm and more',  2, TRUE,  FALSE),
  ('card',       'Credit / Debit card', 'Visa, Mastercard, RuPay',              3, TRUE,  FALSE),
  ('netbanking', 'Net banking',         'All major banks',                      4, TRUE,  FALSE),
  ('wallet',     'Wallet',              'Paytm, Amazon Pay and other wallets',  5, FALSE, FALSE);

-- ---------------- Orders ----------------
CREATE TABLE IF NOT EXISTS orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_no VARCHAR(40) NOT NULL UNIQUE,
  user_id INT NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  payment_method ENUM('cod','card','upi','netbanking','wallet') NOT NULL DEFAULT 'cod',
  payment_status ENUM('pending','paid','failed','refunded') NOT NULL DEFAULT 'pending',
  transaction_ref VARCHAR(150) NULL,
  status ENUM('pending','confirmed','processing','packed','shipped','out_for_delivery','delivered','cancelled','returned')
         NOT NULL DEFAULT 'pending',
  shipping_address JSON NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_order_user FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  product_id INT NOT NULL,
  product_name VARCHAR(200) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  quantity INT NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  CONSTRAINT fk_orderitem_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  CONSTRAINT fk_orderitem_product FOREIGN KEY (product_id) REFERENCES products(id)
) ENGINE=InnoDB;

-- Order tracking history - each row is one status change (source of truth for the tracker UI + AI predictions)
CREATE TABLE IF NOT EXISTS order_tracking (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  status VARCHAR(40) NOT NULL,
  note VARCHAR(255),
  predicted_delivery DATETIME NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_tracking_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Helpful indexes for reporting/filtering
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created ON orders(created_at);
CREATE INDEX idx_products_category ON products(category_id);

-- ---------------- CMS: banners, testimonials, about, contact ----------------
-- Website content managed from the admin panel: banners, testimonials, About page, contact messages.

CREATE TABLE IF NOT EXISTS banners (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(150) NOT NULL,
  subtitle VARCHAR(255) NULL,
  image VARCHAR(255) NULL,
  button_text VARCHAR(60) NULL,
  button_link VARCHAR(255) NULL,
  sort_order INT NOT NULL DEFAULT 0,
  status ENUM('active','inactive') NOT NULL DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS testimonials (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  designation VARCHAR(120) NULL,
  message TEXT NOT NULL,
  rating TINYINT NOT NULL DEFAULT 5,
  image VARCHAR(255) NULL,
  sort_order INT NOT NULL DEFAULT 0,
  status ENUM('active','inactive') NOT NULL DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Single-row table (id = 1): the admin can only update it, never add or delete
CREATE TABLE IF NOT EXISTS about_page (
  id INT PRIMARY KEY,
  title VARCHAR(150) NOT NULL,
  subtitle VARCHAR(255) NULL,
  heading VARCHAR(200) NULL,
  content TEXT NULL,
  mission TEXT NULL,
  vision TEXT NULL,
  image VARCHAR(255) NULL,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

INSERT IGNORE INTO about_page (id, title, subtitle, heading, content, mission, vision) VALUES (
  1,
  'About ShopEase',
  'Everyday essentials, delivered with care.',
  'Shopping that feels simple and friendly',
  'ShopEase brings electronics, fashion and home essentials together in one place. We keep things straightforward: clear prices, a quick checkout and live updates from the moment you order until the parcel reaches your door.',
  'To make online shopping easy, honest and reliable for everyone.',
  'To be the store customers trust first for their everyday needs.'
);

CREATE TABLE IF NOT EXISTS contact_messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(150) NOT NULL,
  phone VARCHAR(20) NULL,
  subject VARCHAR(150) NOT NULL,
  message TEXT NOT NULL,
  status ENUM('new','read','replied') NOT NULL DEFAULT 'new',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_contact_status (status)
) ENGINE=InnoDB;

-- ---------------- Shop settings ----------------
-- Shop details edited on Admin > Home > Contact Us, used by the website header/footer,
-- the Contact us page and invoices. Single row (id = 1): update only.
CREATE TABLE IF NOT EXISTS shop_settings (
  id INT PRIMARY KEY,
  shop_name VARCHAR(120) NOT NULL,
  tagline VARCHAR(160) NULL,
  description VARCHAR(500) NULL,
  logo VARCHAR(255) NULL,
  email VARCHAR(150) NULL,
  mobile VARCHAR(20) NULL,
  alt_phone VARCHAR(20) NULL,
  address_line VARCHAR(255) NULL,
  city VARCHAR(80) NULL,
  state VARCHAR(80) NULL,
  pincode VARCHAR(12) NULL,
  country VARCHAR(80) NULL,
  map_url VARCHAR(500) NULL,
  opening_hours VARCHAR(120) NULL,
  gstin VARCHAR(20) NULL,
  facebook_url VARCHAR(255) NULL,
  instagram_url VARCHAR(255) NULL,
  twitter_url VARCHAR(255) NULL,
  youtube_url VARCHAR(255) NULL,
  whatsapp VARCHAR(20) NULL,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

INSERT IGNORE INTO shop_settings (id, shop_name, tagline, description, email, mobile, address_line, city, state, pincode, country, opening_hours)
VALUES (
  1, 'ShopEase', 'Everyday essentials, delivered fast',
  'Your one-stop shop for electronics, fashion and home essentials. Honest prices, secure checkout and live tracking from order to doorstep.',
  'support@your-domain.com', '+91 00000 00000', 'Your store address, Street name', 'City', 'State', '000000', 'India',
  'Mon - Sat, 9:00 AM - 7:00 PM'
);

-- ---------------- AI chat ----------------
-- Customer <-> AI assistant chat history (website account > AI Assistant).
-- History lives on the server so the browser can't inject fake assistant turns.
CREATE TABLE IF NOT EXISTS chat_messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  role ENUM('user','assistant') NOT NULL,
  content TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  KEY idx_chat_user (user_id, id),
  CONSTRAINT fk_chat_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;
