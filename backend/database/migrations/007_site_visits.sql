-- Website page views (admin > Visitors). One row per page a visitor opens.
CREATE TABLE IF NOT EXISTS site_visits (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ip_address VARCHAR(45) NOT NULL,
  path VARCHAR(255) NOT NULL,
  user_agent VARCHAR(255) NULL,
  referrer VARCHAR(255) NULL,
  user_id INT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  KEY idx_visit_ip (ip_address, id),
  KEY idx_visit_created (created_at),
  CONSTRAINT fk_visit_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;
