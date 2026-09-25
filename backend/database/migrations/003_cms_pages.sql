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
