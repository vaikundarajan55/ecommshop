-- ============================================================
-- Stored Procedures - Ecommerce Database
-- Run this AFTER schema.sql
-- ============================================================
USE ecommerce_db;

DELIMITER //

-- ---------------------------------------------------------------
-- sp_get_user_list: paginated/filterable admin user list
-- ---------------------------------------------------------------
DROP PROCEDURE IF EXISTS sp_get_user_list //
CREATE PROCEDURE sp_get_user_list (
  IN p_role VARCHAR(20),
  IN p_status VARCHAR(20),
  IN p_search VARCHAR(150),
  IN p_limit INT,
  IN p_offset INT
)
BEGIN
  SELECT id, name, email, phone, role, status, created_at
  FROM users
  WHERE (p_role IS NULL OR role = p_role)
    AND (p_status IS NULL OR status = p_status)
    AND (p_search IS NULL OR name LIKE CONCAT('%', p_search, '%') OR email LIKE CONCAT('%', p_search, '%'))
  ORDER BY created_at DESC
  LIMIT p_limit OFFSET p_offset;
END //

-- ---------------------------------------------------------------
-- sp_get_product_list: paginated/filterable product list (admin + website)
-- ---------------------------------------------------------------
DROP PROCEDURE IF EXISTS sp_get_product_list //
CREATE PROCEDURE sp_get_product_list (
  IN p_category_id INT,
  IN p_subcategory_id INT,
  IN p_search VARCHAR(150),
  IN p_status VARCHAR(20),
  IN p_min_price DECIMAL(10,2),
  IN p_max_price DECIMAL(10,2),
  IN p_limit INT,
  IN p_offset INT,
  IN p_highlight VARCHAR(20)
)
BEGIN
  SELECT p.*, c.name AS category_name, sc.name AS subcategory_name,
         (SELECT image FROM product_images pi WHERE pi.product_id = p.id AND pi.is_primary = 1 LIMIT 1) AS primary_image
  FROM products p
  LEFT JOIN categories c ON c.id = p.category_id
  LEFT JOIN subcategories sc ON sc.id = p.subcategory_id
  WHERE (p_category_id IS NULL OR p.category_id = p_category_id)
    AND (p_subcategory_id IS NULL OR p.subcategory_id = p_subcategory_id)
    AND (p_status IS NULL OR p.status = p_status)
    AND (p_min_price IS NULL OR p.price >= p_min_price)
    AND (p_max_price IS NULL OR p.price <= p_max_price)
    AND (p_highlight IS NULL OR p.highlight = p_highlight)
    AND (p_search IS NULL OR MATCH(p.name, p.description) AGAINST (p_search IN NATURAL LANGUAGE MODE)
         OR p.name LIKE CONCAT('%', p_search, '%'))
  ORDER BY p.created_at DESC
  LIMIT p_limit OFFSET p_offset;
END //

-- ---------------------------------------------------------------
-- sp_get_order_list: paginated/filterable admin order list (with tracking + item count)
-- ---------------------------------------------------------------
DROP PROCEDURE IF EXISTS sp_get_order_list //
CREATE PROCEDURE sp_get_order_list (
  IN p_status VARCHAR(30),
  IN p_user_id INT,
  IN p_date_from DATE,
  IN p_date_to DATE,
  IN p_search VARCHAR(150),
  IN p_limit INT,
  IN p_offset INT
)
BEGIN
  SELECT o.id, o.order_no, o.user_id, u.name AS customer_name, u.email AS customer_email,
         o.total_amount, o.payment_method, o.payment_status, o.status,
         o.created_at, o.updated_at,
         (SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = o.id) AS item_count,
         (SELECT status FROM order_tracking ot WHERE ot.order_id = o.id ORDER BY ot.created_at DESC LIMIT 1) AS latest_tracking_status
  FROM orders o
  JOIN users u ON u.id = o.user_id
  WHERE (p_status IS NULL OR o.status = p_status)
    AND (p_user_id IS NULL OR o.user_id = p_user_id)
    AND (p_date_from IS NULL OR DATE(o.created_at) >= p_date_from)
    AND (p_date_to IS NULL OR DATE(o.created_at) <= p_date_to)
    AND (p_search IS NULL OR o.order_no LIKE CONCAT('%', p_search, '%')
         OR u.name LIKE CONCAT('%', p_search, '%') OR u.email LIKE CONCAT('%', p_search, '%'))
  ORDER BY o.created_at DESC
  LIMIT p_limit OFFSET p_offset;
END //

-- ---------------------------------------------------------------
-- sp_get_order_report: order report grouped by day / status / payment_method
-- p_group_by accepts: 'day', 'status', 'payment_method'
-- ---------------------------------------------------------------
DROP PROCEDURE IF EXISTS sp_get_order_report //
CREATE PROCEDURE sp_get_order_report (
  IN p_date_from DATE,
  IN p_date_to DATE,
  IN p_status VARCHAR(30),
  IN p_group_by VARCHAR(20)
)
BEGIN
  IF p_group_by = 'status' THEN
    SELECT o.status AS group_label, COUNT(*) AS total_orders, SUM(o.total_amount) AS total_revenue
    FROM orders o
    WHERE (p_date_from IS NULL OR DATE(o.created_at) >= p_date_from)
      AND (p_date_to IS NULL OR DATE(o.created_at) <= p_date_to)
      AND (p_status IS NULL OR o.status = p_status)
    GROUP BY o.status
    ORDER BY total_orders DESC;

  ELSEIF p_group_by = 'payment_method' THEN
    SELECT o.payment_method AS group_label, COUNT(*) AS total_orders, SUM(o.total_amount) AS total_revenue
    FROM orders o
    WHERE (p_date_from IS NULL OR DATE(o.created_at) >= p_date_from)
      AND (p_date_to IS NULL OR DATE(o.created_at) <= p_date_to)
      AND (p_status IS NULL OR o.status = p_status)
    GROUP BY o.payment_method
    ORDER BY total_orders DESC;

  ELSE -- default: day
    SELECT DATE(o.created_at) AS group_label, COUNT(*) AS total_orders, SUM(o.total_amount) AS total_revenue
    FROM orders o
    WHERE (p_date_from IS NULL OR DATE(o.created_at) >= p_date_from)
      AND (p_date_to IS NULL OR DATE(o.created_at) <= p_date_to)
      AND (p_status IS NULL OR o.status = p_status)
    GROUP BY DATE(o.created_at)
    ORDER BY group_label DESC;
  END IF;
END //

-- ---------------------------------------------------------------
-- sp_place_order_item: (example of a single-row insert procedure, used if you prefer
-- calling a procedure per item instead of the Node-side transaction in orderModel.js)
-- ---------------------------------------------------------------
DROP PROCEDURE IF EXISTS sp_place_order_item //
CREATE PROCEDURE sp_place_order_item (
  IN p_order_id INT,
  IN p_product_id INT,
  IN p_product_name VARCHAR(200),
  IN p_price DECIMAL(10,2),
  IN p_quantity INT
)
BEGIN
  DECLARE v_subtotal DECIMAL(10,2);
  SET v_subtotal = p_price * p_quantity;

  INSERT INTO order_items (order_id, product_id, product_name, price, quantity, subtotal)
  VALUES (p_order_id, p_product_id, p_product_name, p_price, p_quantity, v_subtotal);

  UPDATE products SET stock = stock - p_quantity WHERE id = p_product_id AND stock >= p_quantity;
END //

DELIMITER ;
