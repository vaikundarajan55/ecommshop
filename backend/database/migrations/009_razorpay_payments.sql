-- Razorpay online payments. A row is created when checkout opens; the shop order is only
-- created once the payment is verified, so abandoned/failed payments leave no orders behind.
CREATE TABLE IF NOT EXISTS razorpay_payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  razorpay_order_id VARCHAR(40) NOT NULL UNIQUE,
  razorpay_payment_id VARCHAR(40) NULL,
  amount DECIMAL(10,2) NOT NULL,             -- rupees, priced on the server
  payment_method ENUM('card','upi','netbanking','wallet') NOT NULL,
  items JSON NOT NULL,                        -- server-priced cart snapshot
  status ENUM('created','processing','paid','failed') NOT NULL DEFAULT 'created',
  order_id INT NULL,                          -- shop order created after payment
  error VARCHAR(255) NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_rzp_user (user_id),
  CONSTRAINT fk_rzp_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_rzp_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL
) ENGINE=InnoDB;
