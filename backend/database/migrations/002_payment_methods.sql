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
