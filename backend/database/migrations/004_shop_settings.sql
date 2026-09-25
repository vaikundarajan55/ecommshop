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
