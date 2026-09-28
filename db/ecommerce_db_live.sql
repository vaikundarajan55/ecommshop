-- phpMyAdmin SQL Dump
-- version 5.2.0
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Sep 28, 2026 at 08:11 AM
-- Server version: 10.4.24-MariaDB
-- PHP Version: 8.2.0

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `ecommerce_db_live`
--

DELIMITER $$
--
-- Procedures
--
CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_get_order_list` (IN `p_status` VARCHAR(30), IN `p_user_id` INT, IN `p_date_from` DATE, IN `p_date_to` DATE, IN `p_search` VARCHAR(150), IN `p_limit` INT, IN `p_offset` INT)   BEGIN
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
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_get_order_report` (IN `p_date_from` DATE, IN `p_date_to` DATE, IN `p_status` VARCHAR(30), IN `p_group_by` VARCHAR(20))   BEGIN
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
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_get_product_list` (IN `p_category_id` INT, IN `p_subcategory_id` INT, IN `p_search` VARCHAR(150), IN `p_status` VARCHAR(20), IN `p_min_price` DECIMAL(10,2), IN `p_max_price` DECIMAL(10,2), IN `p_limit` INT, IN `p_offset` INT, IN `p_highlight` VARCHAR(20))   BEGIN
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
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_get_user_list` (IN `p_role` VARCHAR(20), IN `p_status` VARCHAR(20), IN `p_search` VARCHAR(150), IN `p_limit` INT, IN `p_offset` INT)   BEGIN
  SELECT id, name, email, phone, role, status, created_at
  FROM users
  WHERE (p_role IS NULL OR role = p_role)
    AND (p_status IS NULL OR status = p_status)
    AND (p_search IS NULL OR name LIKE CONCAT('%', p_search, '%') OR email LIKE CONCAT('%', p_search, '%'))
  ORDER BY created_at DESC
  LIMIT p_limit OFFSET p_offset;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_place_order_item` (IN `p_order_id` INT, IN `p_product_id` INT, IN `p_product_name` VARCHAR(200), IN `p_price` DECIMAL(10,2), IN `p_quantity` INT)   BEGIN
  DECLARE v_subtotal DECIMAL(10,2);
  SET v_subtotal = p_price * p_quantity;

  INSERT INTO order_items (order_id, product_id, product_name, price, quantity, subtotal)
  VALUES (p_order_id, p_product_id, p_product_name, p_price, p_quantity, v_subtotal);

  UPDATE products SET stock = stock - p_quantity WHERE id = p_product_id AND stock >= p_quantity;
END$$

DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `about_page`
--

CREATE TABLE `about_page` (
  `id` int(11) NOT NULL,
  `title` varchar(150) NOT NULL,
  `subtitle` varchar(255) DEFAULT NULL,
  `heading` varchar(200) DEFAULT NULL,
  `content` text DEFAULT NULL,
  `mission` text DEFAULT NULL,
  `vision` text DEFAULT NULL,
  `image` varchar(255) DEFAULT NULL,
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `about_page`
--

INSERT INTO `about_page` (`id`, `title`, `subtitle`, `heading`, `content`, `mission`, `vision`, `image`, `updated_at`) VALUES
(1, 'About ShopEase', 'Everyday essentials, delivered with care.', 'Shopping that feels simple and friendly', 'ShopEase brings electronics, fashion and home essentials together in one place. We keep things straightforward: clear prices, a quick checkout and live updates from the moment you order until the parcel reaches your door.sdas', 'To make online shopping easy, honest and reliable for everyone.', 'To be the store customers trust first for their everyday needs.', NULL, '2026-09-23 15:33:03');

-- --------------------------------------------------------

--
-- Table structure for table `banners`
--

CREATE TABLE `banners` (
  `id` int(11) NOT NULL,
  `title` varchar(150) NOT NULL,
  `subtitle` varchar(255) DEFAULT NULL,
  `image` varchar(255) DEFAULT NULL,
  `button_text` varchar(60) DEFAULT NULL,
  `button_link` varchar(255) DEFAULT NULL,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `status` enum('active','inactive') NOT NULL DEFAULT 'active',
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Table structure for table `cart_items`
--

CREATE TABLE `cart_items` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `quantity` int(11) NOT NULL DEFAULT 1,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Table structure for table `categories`
--

CREATE TABLE `categories` (
  `id` int(11) NOT NULL,
  `name` varchar(150) NOT NULL,
  `slug` varchar(180) NOT NULL,
  `image` varchar(255) DEFAULT NULL,
  `status` enum('active','inactive') NOT NULL DEFAULT 'active',
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `categories`
--

INSERT INTO `categories` (`id`, `name`, `slug`, `image`, `status`, `created_at`, `updated_at`) VALUES
(1, 'Vegetable', 'vegetable-52611', '/uploads/1790575352585-16149499.jpg', 'active', '2026-09-21 15:46:56', '2026-09-28 11:32:32'),
(5, 'Food', 'food-30162', '/uploads/1790575330147-620826940.jpeg', 'active', '2026-09-23 10:43:50', '2026-09-28 11:32:10'),
(7, 'Electroic', 'electroic-14656', '/uploads/1790575314227-293327776.png', 'active', '2026-09-23 10:58:45', '2026-09-28 11:31:54'),
(11, 'Food Product', 'food-product-74830', '/uploads/1790575374736-482610092.jpeg', 'active', '2026-09-28 11:32:54', '2026-09-28 11:32:54');

-- --------------------------------------------------------

--
-- Table structure for table `chat_messages`
--

CREATE TABLE `chat_messages` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `role` enum('user','assistant') NOT NULL,
  `content` text NOT NULL,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `chat_messages`
--

INSERT INTO `chat_messages` (`id`, `user_id`, `role`, `content`, `created_at`) VALUES
(1, 7, 'user', 'Where is my order?', '2026-09-23 17:20:09'),
(2, 9, 'user', 'Where is my order?', '2026-09-23 17:20:33'),
(3, 11, 'user', 'Where is my order?', '2026-09-23 17:20:50');

-- --------------------------------------------------------

--
-- Table structure for table `contact_messages`
--

CREATE TABLE `contact_messages` (
  `id` int(11) NOT NULL,
  `name` varchar(120) NOT NULL,
  `email` varchar(150) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `subject` varchar(150) NOT NULL,
  `message` text NOT NULL,
  `status` enum('new','read','replied') NOT NULL DEFAULT 'new',
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Table structure for table `orders`
--

CREATE TABLE `orders` (
  `id` int(11) NOT NULL,
  `order_no` varchar(40) NOT NULL,
  `user_id` int(11) NOT NULL,
  `total_amount` decimal(10,2) NOT NULL,
  `payment_method` enum('cod','card','upi','netbanking','wallet') NOT NULL DEFAULT 'cod',
  `payment_status` enum('pending','paid','failed','refunded') NOT NULL DEFAULT 'pending',
  `transaction_ref` varchar(150) DEFAULT NULL,
  `status` enum('pending','confirmed','processing','packed','shipped','out_for_delivery','delivered','cancelled','returned') NOT NULL DEFAULT 'pending',
  `shipping_address` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`shipping_address`)),
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `orders`
--

INSERT INTO `orders` (`id`, `order_no`, `user_id`, `total_amount`, `payment_method`, `payment_status`, `transaction_ref`, `status`, `shipping_address`, `created_at`, `updated_at`) VALUES
(5, 'ORD-1790148575307', 3, '259.00', 'upi', 'pending', NULL, 'pending', '{\"line1\":\"chenai\",\"city\":\"chenai\",\"state\":\"chenai\",\"pincode\":\"600066\",\"phone\":\"9976733564\"}', '2026-09-23 12:59:35', '2026-09-23 12:59:37'),
(6, 'ORD-1790148769788', 3, '27.00', 'cod', 'pending', NULL, 'pending', '{\"line1\":\"ddfd\",\"city\":\"dfsdf\",\"state\":\"dfsdf\",\"pincode\":\"234444\",\"phone\":\"9976733564\"}', '2026-09-23 13:02:49', '2026-09-23 13:02:50'),
(7, 'ORD-1790149831873', 3, '20.00', 'cod', 'pending', NULL, 'pending', '{\"line1\":\"rftreter\",\"city\":\"tertretre\",\"state\":\"erterte\",\"pincode\":\"233231\",\"phone\":\"9976733564\"}', '2026-09-23 13:20:31', '2026-09-23 13:20:32'),
(10, 'MINE1790164209005', 7, '450.00', 'cod', 'pending', NULL, 'packed', '{}', '2026-09-23 17:20:09', '2026-09-23 17:20:09'),
(11, 'SECRET1790164233235', 10, '999.00', 'cod', 'pending', NULL, 'shipped', '{}', '2026-09-23 17:20:33', '2026-09-23 17:20:33'),
(12, 'MINE1790164233260', 9, '450.00', 'cod', 'pending', NULL, 'packed', '{}', '2026-09-23 17:20:33', '2026-09-23 17:20:33'),
(13, 'SECRET1790164250026', 12, '999.00', 'cod', 'pending', NULL, 'shipped', '{}', '2026-09-23 17:20:50', '2026-09-23 17:20:50'),
(14, 'MINE1790164250049', 11, '450.00', 'cod', 'pending', NULL, 'packed', '{}', '2026-09-23 17:20:50', '2026-09-23 17:20:50'),
(20, 'ORD-1790226836934', 3, '20.00', 'upi', 'pending', NULL, 'pending', '{\"line1\":\"fg\",\"city\":\"dgdfgd\",\"state\":\"fgdfg\",\"pincode\":\"445353\",\"phone\":\"9976733564\"}', '2026-09-24 10:43:56', '2026-09-24 10:43:57'),
(21, 'ORD-1790227480987', 3, '18.00', 'card', 'pending', NULL, 'pending', '{\"line1\":\"ddsfsdfsd\",\"city\":\"dsdfsd\",\"state\":\"sdfsdf\",\"pincode\":\"234567\",\"phone\":\"9976733564\"}', '2026-09-24 10:54:40', '2026-09-24 10:54:41'),
(23, 'ORD-1790228182891', 3, '9.00', 'card', 'paid', 'pay_DEMO34ad02f263baa5', 'pending', '{\"line1\":\"dfsd\",\"city\":\"fsdf\",\"state\":\"sdfsd\",\"pincode\":\"455345\",\"phone\":\"9976733564\"}', '2026-09-24 11:06:22', '2026-09-24 11:06:23'),
(24, 'ORD-1790228373407', 3, '9.00', 'card', 'paid', 'pay_DEMOb2edbe476f2f29', 'pending', '{\"line1\":\"vv\",\"city\":\"bvbv\",\"state\":\"vbv\",\"pincode\":\"345678\",\"phone\":\"9976733564\"}', '2026-09-24 11:09:33', '2026-09-24 11:09:33'),
(25, 'ORD-1790575791014', 3, '140.00', 'card', 'paid', 'pay_DEMO9210c613c59651', 'pending', '{\"line1\":\"rwerw\",\"city\":\"werwe\",\"state\":\"rwer\",\"pincode\":\"234424\",\"phone\":\"9976733564\"}', '2026-09-28 11:39:51', '2026-09-28 11:39:51');

-- --------------------------------------------------------

--
-- Table structure for table `order_items`
--

CREATE TABLE `order_items` (
  `id` int(11) NOT NULL,
  `order_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `product_name` varchar(200) NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `quantity` int(11) NOT NULL,
  `subtotal` decimal(10,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `order_items`
--

INSERT INTO `order_items` (`id`, `order_id`, `product_id`, `product_name`, `price`, `quantity`, `subtotal`) VALUES
(1, 5, 5, 'dfsdf', '232.00', 1, '232.00'),
(2, 5, 4, 'asAS', '9.00', 3, '27.00'),
(3, 6, 4, 'asAS', '9.00', 3, '27.00'),
(4, 7, 1, 'Testt', '20.00', 1, '20.00'),
(8, 20, 1, 'Testt', '20.00', 1, '20.00'),
(9, 21, 4, 'asAS', '9.00', 2, '18.00'),
(11, 23, 4, 'asAS', '9.00', 1, '9.00'),
(12, 24, 4, 'asAS', '9.00', 1, '9.00'),
(13, 25, 8, 'Veg', '140.00', 1, '140.00');

-- --------------------------------------------------------

--
-- Table structure for table `order_tracking`
--

CREATE TABLE `order_tracking` (
  `id` int(11) NOT NULL,
  `order_id` int(11) NOT NULL,
  `status` varchar(40) NOT NULL,
  `note` varchar(255) DEFAULT NULL,
  `predicted_delivery` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `order_tracking`
--

INSERT INTO `order_tracking` (`id`, `order_id`, `status`, `note`, `predicted_delivery`, `created_at`) VALUES
(1, 5, 'pending', 'Order placed by customer', NULL, '2026-09-23 12:59:35'),
(2, 5, 'pending', 'AI predicted delivery window generated', '2026-09-26 07:29:37', '2026-09-23 12:59:37'),
(3, 6, 'pending', 'Order placed by customer', NULL, '2026-09-23 13:02:50'),
(4, 6, 'pending', 'AI predicted delivery window generated', '2026-09-27 07:32:50', '2026-09-23 13:02:50'),
(5, 7, 'pending', 'Order placed by customer', NULL, '2026-09-23 13:20:32'),
(6, 7, 'pending', 'AI predicted delivery window generated', '2026-09-27 07:50:32', '2026-09-23 13:20:32'),
(9, 20, 'pending', 'Order placed by customer', NULL, '2026-09-24 10:43:56'),
(10, 20, 'pending', 'AI predicted delivery window generated', '2026-09-28 05:13:57', '2026-09-24 10:43:57'),
(11, 21, 'pending', 'Order placed by customer', NULL, '2026-09-24 10:54:41'),
(12, 21, 'pending', 'AI predicted delivery window generated', '2026-09-28 05:24:41', '2026-09-24 10:54:41'),
(15, 23, 'pending', 'Order placed - payment received (pay_DEMO34ad02f263baa5)', NULL, '2026-09-24 11:06:22'),
(16, 23, 'pending', 'AI predicted delivery window generated', '2026-09-28 05:36:23', '2026-09-24 11:06:23'),
(17, 24, 'pending', 'Order placed - payment received (pay_DEMOb2edbe476f2f29)', NULL, '2026-09-24 11:09:33'),
(18, 24, 'pending', 'AI predicted delivery window generated', '2026-09-28 05:39:33', '2026-09-24 11:09:33'),
(19, 25, 'pending', 'Order placed - payment received (pay_DEMO9210c613c59651)', NULL, '2026-09-28 11:39:51');

-- --------------------------------------------------------

--
-- Table structure for table `payment_methods`
--

CREATE TABLE `payment_methods` (
  `id` int(11) NOT NULL,
  `code` enum('cod','card','upi','netbanking','wallet') NOT NULL,
  `name` varchar(80) NOT NULL,
  `description` varchar(160) DEFAULT NULL,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `is_default` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `payment_methods`
--

INSERT INTO `payment_methods` (`id`, `code`, `name`, `description`, `sort_order`, `is_active`, `is_default`, `created_at`, `updated_at`) VALUES
(1, 'cod', 'Cash on Delivery', 'Pay when your order arrives', 1, 1, 1, '2026-09-23 13:10:12', '2026-09-23 13:13:21'),
(2, 'upi', 'UPI', 'Google Pay, PhonePe, Paytm and more', 2, 1, 0, '2026-09-23 13:10:12', '2026-09-23 13:13:21'),
(3, 'card', 'Credit / Debit card', 'Visa, Mastercard, RuPay', 3, 1, 0, '2026-09-23 13:10:12', '2026-09-23 13:13:21'),
(4, 'netbanking', 'Net banking', 'All major banks', 4, 1, 0, '2026-09-23 13:10:12', '2026-09-23 13:10:12'),
(5, 'wallet', 'Wallet', 'Paytm, Amazon Pay and other wallets', 5, 0, 0, '2026-09-23 13:10:12', '2026-09-23 13:10:12');

-- --------------------------------------------------------

--
-- Table structure for table `products`
--

CREATE TABLE `products` (
  `id` int(11) NOT NULL,
  `category_id` int(11) NOT NULL,
  `subcategory_id` int(11) DEFAULT NULL,
  `name` varchar(200) NOT NULL,
  `slug` varchar(230) NOT NULL,
  `sku` varchar(80) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `price` decimal(10,2) NOT NULL,
  `discount_price` decimal(10,2) DEFAULT NULL,
  `stock` int(11) NOT NULL DEFAULT 0,
  `status` enum('active','inactive','out_of_stock') NOT NULL DEFAULT 'active',
  `highlight` enum('none','featured','current') NOT NULL DEFAULT 'none',
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `products`
--

INSERT INTO `products` (`id`, `category_id`, `subcategory_id`, `name`, `slug`, `sku`, `description`, `price`, `discount_price`, `stock`, `status`, `highlight`, `created_at`, `updated_at`) VALUES
(1, 5, 8, 'Test LIve', 'test-live-11399', '100', 'dasdasd', '250.00', '20.00', 8, 'active', 'featured', '2026-09-23 11:02:10', '2026-09-28 11:36:51'),
(4, 7, 6, 'Live Test', 'live-test-75648', 'A34234', 'DFSDF', '29.00', '9.00', 10, 'active', 'current', '2026-09-23 11:14:33', '2026-09-28 11:36:15'),
(5, 11, 5, 'Vegetable', 'vegetable-40414', 'sdfsd', 'sdfsdf', '232.00', '230.00', 231, 'active', 'none', '2026-09-23 11:23:53', '2026-09-28 11:35:40'),
(8, 1, 9, 'Veg', 'veg-78351', '23123123', 'dfsdf', '200.00', '140.00', 19, 'active', 'current', '2026-09-28 11:37:58', '2026-09-28 11:39:51');

-- --------------------------------------------------------

--
-- Table structure for table `product_images`
--

CREATE TABLE `product_images` (
  `id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `image` varchar(255) NOT NULL,
  `is_primary` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `product_images`
--

INSERT INTO `product_images` (`id`, `product_id`, `image`, `is_primary`) VALUES
(10, 5, '/uploads/1790575540098-920454778.jpeg', 1),
(11, 5, '/uploads/1790575540100-12836413.jpg', 0),
(12, 5, '/uploads/1790575540106-620568807.jpeg', 0),
(13, 4, '/uploads/1790575575591-753175898.jpeg', 1),
(14, 4, '/uploads/1790575575591-526256424.jpg', 0),
(15, 4, '/uploads/1790575575593-774319589.png', 0),
(16, 1, '/uploads/1790575611347-167602589.jpeg', 1),
(17, 1, '/uploads/1790575611348-488326379.jpeg', 0),
(18, 1, '/uploads/1790575611349-878083791.jpeg', 0),
(19, 1, '/uploads/1790575611350-500500574.jpeg', 0),
(20, 8, '/uploads/1790575677999-711453053.jpg', 1),
(21, 8, '/uploads/1790575677999-871137692.jpeg', 0),
(22, 8, '/uploads/1790575677999-475722440.jpg', 0),
(23, 8, '/uploads/1790575678000-895846637.jpeg', 0);

-- --------------------------------------------------------

--
-- Table structure for table `razorpay_payments`
--

CREATE TABLE `razorpay_payments` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `razorpay_order_id` varchar(40) NOT NULL,
  `razorpay_payment_id` varchar(40) DEFAULT NULL,
  `amount` decimal(10,2) NOT NULL,
  `payment_method` enum('card','upi','netbanking','wallet') NOT NULL,
  `items` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`items`)),
  `status` enum('created','processing','paid','failed') NOT NULL DEFAULT 'created',
  `order_id` int(11) DEFAULT NULL,
  `error` varchar(255) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `razorpay_payments`
--

INSERT INTO `razorpay_payments` (`id`, `user_id`, `razorpay_order_id`, `razorpay_payment_id`, `amount`, `payment_method`, `items`, `status`, `order_id`, `error`, `created_at`, `updated_at`) VALUES
(3, 3, 'order_DEMOb5f152fa6f1787', 'pay_DEMO34ad02f263baa5', '9.00', 'card', '[{\"productId\":4,\"name\":\"asAS\",\"price\":9,\"quantity\":1}]', 'paid', 23, NULL, '2026-09-24 11:06:15', '2026-09-24 11:06:22'),
(4, 3, 'order_DEMOcfeadb4c6317e8', 'pay_DEMOb2edbe476f2f29', '9.00', 'card', '[{\"productId\":4,\"name\":\"asAS\",\"price\":9,\"quantity\":1}]', 'paid', 24, NULL, '2026-09-24 11:09:24', '2026-09-24 11:09:33'),
(5, 3, 'order_DEMOe490a37b2681b3', 'pay_DEMO9210c613c59651', '140.00', 'card', '[{\"productId\":8,\"name\":\"Veg\",\"price\":140,\"quantity\":1}]', 'paid', 25, NULL, '2026-09-28 11:39:45', '2026-09-28 11:39:51');

-- --------------------------------------------------------

--
-- Table structure for table `shop_settings`
--

CREATE TABLE `shop_settings` (
  `id` int(11) NOT NULL,
  `shop_name` varchar(120) NOT NULL,
  `tagline` varchar(160) DEFAULT NULL,
  `description` varchar(500) DEFAULT NULL,
  `logo` varchar(255) DEFAULT NULL,
  `email` varchar(150) DEFAULT NULL,
  `mobile` varchar(20) DEFAULT NULL,
  `alt_phone` varchar(20) DEFAULT NULL,
  `address_line` varchar(255) DEFAULT NULL,
  `city` varchar(80) DEFAULT NULL,
  `state` varchar(80) DEFAULT NULL,
  `pincode` varchar(12) DEFAULT NULL,
  `country` varchar(80) DEFAULT NULL,
  `map_url` varchar(500) DEFAULT NULL,
  `opening_hours` varchar(120) DEFAULT NULL,
  `gstin` varchar(20) DEFAULT NULL,
  `facebook_url` varchar(255) DEFAULT NULL,
  `instagram_url` varchar(255) DEFAULT NULL,
  `twitter_url` varchar(255) DEFAULT NULL,
  `youtube_url` varchar(255) DEFAULT NULL,
  `whatsapp` varchar(20) DEFAULT NULL,
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `shop_settings`
--

INSERT INTO `shop_settings` (`id`, `shop_name`, `tagline`, `description`, `logo`, `email`, `mobile`, `alt_phone`, `address_line`, `city`, `state`, `pincode`, `country`, `map_url`, `opening_hours`, `gstin`, `facebook_url`, `instagram_url`, `twitter_url`, `youtube_url`, `whatsapp`, `updated_at`) VALUES
(1, 'ShopEase', 'Everyday essentials, delivered fast', 'Your one-stop shop for electronics, fashion and home essentials. Honest prices, secure checkout and live tracking from order to doorstep.', NULL, 'support@your-domain.com', '+91 00000 00000', NULL, 'Your store address, Street name', 'City', 'State', '000000', 'India', NULL, 'Mon - Sat, 9:00 AM - 7:00 PM', NULL, NULL, NULL, NULL, NULL, NULL, '2026-09-23 15:50:18');

-- --------------------------------------------------------

--
-- Table structure for table `site_visits`
--

CREATE TABLE `site_visits` (
  `id` int(11) NOT NULL,
  `ip_address` varchar(45) NOT NULL,
  `path` varchar(255) NOT NULL,
  `page_name` varchar(200) DEFAULT NULL,
  `user_agent` varchar(255) DEFAULT NULL,
  `referrer` varchar(255) DEFAULT NULL,
  `user_id` int(11) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `site_visits`
--

INSERT INTO `site_visits` (`id`, `ip_address`, `path`, `page_name`, `user_agent`, `referrer`, `user_id`, `created_at`) VALUES
(2, '192.168.1.103', '/', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36', NULL, NULL, '2026-09-24 10:21:05'),
(3, '192.168.1.103', '/about', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36', NULL, NULL, '2026-09-24 10:21:57'),
(10, '192.168.1.103', '/products', 'Products', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36', NULL, NULL, '2026-09-24 10:25:28'),
(11, '192.168.1.103', '/products/4', 'Product: asAS', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36', NULL, NULL, '2026-09-24 10:25:29'),
(13, '192.168.1.103', '/products/4', 'Product: asAS', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36', NULL, NULL, '2026-09-24 10:43:10'),
(14, '192.168.1.103', '/products/4', 'Product: asAS', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36', NULL, NULL, '2026-09-24 10:43:11'),
(15, '192.168.1.103', '/login', 'Login', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36', NULL, NULL, '2026-09-24 10:43:12'),
(16, '192.168.1.103', '/dashboard', 'My Account', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36', NULL, 3, '2026-09-24 10:43:23'),
(17, '192.168.1.103', '/products', 'Products', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36', NULL, 3, '2026-09-24 10:43:30'),
(18, '192.168.1.103', '/products/1', 'Product: Testt', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36', NULL, 3, '2026-09-24 10:43:33'),
(19, '192.168.1.103', '/cart', 'Cart', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36', NULL, 3, '2026-09-24 10:43:40'),
(20, '192.168.1.103', '/checkout', 'Checkout', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36', NULL, 3, '2026-09-24 10:43:42'),
(21, '192.168.1.103', '/payment', 'Payment', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36', NULL, 3, '2026-09-24 10:43:52'),
(22, '192.168.1.103', '/checkout', 'Checkout', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36', NULL, 3, '2026-09-24 10:43:57'),
(23, '192.168.1.103', '/cart', 'Cart', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36', NULL, 3, '2026-09-24 10:43:57'),
(24, '192.168.1.103', '/checkout', 'Checkout', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36', NULL, 3, '2026-09-24 10:44:09'),
(25, '192.168.1.103', '/cart', 'Cart', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36', NULL, 3, '2026-09-24 10:44:09'),
(26, '192.168.1.103', '/products', 'Products', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36', NULL, 3, '2026-09-24 10:44:11'),
(27, '192.168.1.103', '/products/4', 'Product: asAS', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36', NULL, 3, '2026-09-24 10:44:12'),
(28, '192.168.1.103', '/cart', 'Cart', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36', NULL, 3, '2026-09-24 10:54:18'),
(29, '192.168.1.103', '/checkout', 'Checkout', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36', NULL, 3, '2026-09-24 10:54:20'),
(30, '192.168.1.103', '/payment', 'Payment', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36', NULL, 3, '2026-09-24 10:54:35'),
(31, '192.168.1.103', '/checkout', 'Checkout', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36', NULL, 3, '2026-09-24 10:54:41'),
(32, '192.168.1.103', '/cart', 'Cart', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36', NULL, 3, '2026-09-24 10:54:41'),
(33, '192.168.1.103', '/products', 'Products', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36', NULL, 3, '2026-09-24 10:54:46'),
(34, '192.168.1.103', '/products', 'Products', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36', NULL, 3, '2026-09-24 11:05:48'),
(35, '192.168.1.103', '/products/4', 'Product: asAS', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36', NULL, 3, '2026-09-24 11:05:49'),
(36, '192.168.1.103', '/cart', 'Cart', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36', NULL, 3, '2026-09-24 11:05:55'),
(37, '192.168.1.103', '/checkout', 'Checkout', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36', NULL, 3, '2026-09-24 11:05:58'),
(38, '192.168.1.103', '/payment', 'Payment', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36', NULL, 3, '2026-09-24 11:06:09'),
(39, '192.168.1.103', '/checkout', 'Checkout', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36', NULL, 3, '2026-09-24 11:06:23'),
(40, '192.168.1.103', '/cart', 'Cart', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36', NULL, 3, '2026-09-24 11:06:23'),
(41, '192.168.1.103', '/products', 'Products', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36', NULL, 3, '2026-09-24 11:06:31'),
(42, '192.168.1.103', '/products', 'Products', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36', NULL, 3, '2026-09-24 11:09:06'),
(43, '192.168.1.103', '/products/4', 'Product: asAS', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36', NULL, 3, '2026-09-24 11:09:07'),
(44, '192.168.1.103', '/cart', 'Cart', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36', NULL, 3, '2026-09-24 11:09:11'),
(45, '192.168.1.103', '/checkout', 'Checkout', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36', NULL, 3, '2026-09-24 11:09:12'),
(46, '192.168.1.103', '/payment', 'Payment', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36', NULL, 3, '2026-09-24 11:09:18'),
(47, '192.168.1.103', '/checkout', 'Checkout', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36', NULL, 3, '2026-09-24 11:09:33'),
(48, '192.168.1.103', '/cart', 'Cart', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36', NULL, 3, '2026-09-24 11:09:33'),
(49, '192.168.1.103', '/products', 'Products', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36', NULL, 3, '2026-09-24 11:09:38'),
(50, '192.168.1.103', '/products', 'Products', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36', 'http://localhost:5174/products', 3, '2026-09-24 11:12:19'),
(51, '192.168.1.103', '/', 'Home', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36', 'http://localhost:5174/products', 3, '2026-09-24 11:12:40'),
(52, '192.168.1.103', '/', 'Home', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36', 'http://localhost:5174/products', 3, '2026-09-24 11:36:14'),
(53, '192.168.1.103', '/login', 'Login', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36', 'http://localhost:5174/products', NULL, '2026-09-24 11:36:22'),
(54, '192.168.1.103', '/dashboard', 'My Account', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36', 'http://localhost:5174/products', 3, '2026-09-24 11:36:44'),
(55, '192.168.1.103', '/products', 'Products', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36', 'http://localhost:5174/products', 3, '2026-09-24 11:36:55'),
(56, '192.168.1.103', '/products', 'Products', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36', 'http://localhost:5174/products', 3, '2026-09-24 12:00:19'),
(57, '192.168.1.103', '/products', 'Products', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36', 'http://localhost:5174/products', 3, '2026-09-24 12:03:08'),
(58, '192.168.1.103', '/products', 'Products', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36', 'http://localhost:5174/products', 3, '2026-09-24 12:09:33'),
(59, '192.168.1.103', '/', 'Home', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36', 'http://localhost:5174/products', 3, '2026-09-24 12:14:43'),
(60, '192.168.1.103', '/', 'Home', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36', 'http://localhost:5174/products', 3, '2026-09-24 12:16:19'),
(61, '192.168.1.103', '/', 'Home', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36', 'http://localhost:5174/products', 3, '2026-09-24 12:20:23'),
(62, '192.168.1.103', '/', 'Home', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36', 'http://localhost:5174/products', 3, '2026-09-24 12:22:58'),
(63, '192.168.1.103', '/', 'Home', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36', 'http://localhost:5174/products', 3, '2026-09-24 12:22:59'),
(64, '192.168.1.103', '/', 'Home', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36', 'http://localhost:5174/products', 3, '2026-09-24 12:25:27'),
(65, '192.168.1.103', '/products', 'Products', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36', 'http://localhost:5174/products', 3, '2026-09-24 12:25:35'),
(66, '192.168.1.103', '/', 'Home', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36', 'http://localhost:5174/products', 3, '2026-09-24 12:25:37'),
(67, '192.168.1.103', '/', 'Home', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/153.0.0.0 Safari/537.36', NULL, NULL, '2026-09-24 12:28:56'),
(68, '192.168.1.103', '/login', 'Login', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/153.0.0.0 Safari/537.36', NULL, NULL, '2026-09-24 12:29:07'),
(69, '192.168.1.103', '/', 'Home', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/153.0.0.0 Safari/537.36', NULL, NULL, '2026-09-24 12:29:31'),
(70, '192.168.1.103', '/', 'Home', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36', NULL, NULL, '2026-09-24 12:33:13'),
(71, '192.168.1.103', '/products', 'Products', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36', NULL, NULL, '2026-09-24 12:33:19'),
(72, '192.168.1.103', '/', 'Home', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36', 'http://localhost:5174/products', 3, '2026-09-24 12:34:20'),
(73, '192.168.1.103', '/', 'Home', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36', 'http://localhost:5174/', 3, '2026-09-24 12:39:15'),
(74, '192.168.1.103', '/', 'Home', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36', 'http://localhost:5174/', 3, '2026-09-24 12:39:17'),
(75, '192.168.1.103', '/', 'Home', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36', 'http://localhost:5174/', 3, '2026-09-24 12:44:01'),
(76, '192.168.1.103', '/', 'Home', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36', 'http://localhost:5174/', 3, '2026-09-24 12:47:02'),
(77, '192.168.1.103', '/', 'Home', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36', 'http://localhost:5174/', 3, '2026-09-24 12:53:38'),
(78, '192.168.1.103', '/', 'Home', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36', 'http://localhost:5174/', 3, '2026-09-24 12:53:52'),
(79, '192.168.1.103', '/', 'Home', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36', 'http://localhost:5174/', 3, '2026-09-24 12:56:43'),
(80, '192.168.1.103', '/', 'Home', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36', 'http://localhost:5174/', 3, '2026-09-24 12:56:54'),
(81, '192.168.1.103', '/', 'Home', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36', 'http://localhost:5174/', 3, '2026-09-24 13:01:35'),
(82, '192.168.1.103', '/', 'Home', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36', 'http://localhost:5174/', 3, '2026-09-24 13:02:26'),
(83, '192.168.1.103', '/', 'Home', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36', 'http://localhost:5174/', 3, '2026-09-24 13:05:22'),
(84, '192.168.1.103', '/', 'Home', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36', NULL, NULL, '2026-09-24 13:14:42'),
(85, '192.168.1.103', '/', 'Home', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36', 'http://localhost:5174/', 3, '2026-09-24 13:15:01'),
(86, '192.168.1.103', '/', 'Home', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36', 'http://localhost:5174/', 3, '2026-09-24 13:15:01'),
(87, '192.168.1.103', '/', 'Home', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36', NULL, NULL, '2026-09-25 12:12:39'),
(88, '192.168.1.103', '/', 'Home', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36', NULL, NULL, '2026-09-28 11:06:22'),
(89, '192.168.1.103', '/', 'Home', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36', NULL, NULL, '2026-09-28 11:38:05'),
(90, '192.168.1.103', '/products/8', 'Product: Veg', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36', NULL, NULL, '2026-09-28 11:38:15'),
(91, '192.168.1.103', '/', 'Home', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36', NULL, NULL, '2026-09-28 11:38:24'),
(92, '192.168.1.103', '/products?categoryId=1', 'Products: Vegetable', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36', NULL, NULL, '2026-09-28 11:38:30'),
(93, '192.168.1.103', '/products/8', 'Product: Veg', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36', NULL, NULL, '2026-09-28 11:38:33'),
(94, '192.168.1.103', '/cart', 'Cart', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36', NULL, NULL, '2026-09-28 11:38:42'),
(95, '192.168.1.103', '/checkout', 'Checkout', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36', NULL, NULL, '2026-09-28 11:38:45'),
(96, '192.168.1.103', '/login', 'Login', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36', NULL, NULL, '2026-09-28 11:38:45'),
(97, '192.168.1.103', '/checkout', 'Checkout', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36', NULL, 3, '2026-09-28 11:39:28'),
(98, '192.168.1.103', '/payment', 'Payment', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36', NULL, 3, '2026-09-28 11:39:39'),
(99, '192.168.1.103', '/checkout', 'Checkout', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36', NULL, 3, '2026-09-28 11:39:53'),
(100, '192.168.1.103', '/cart', 'Cart', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36', NULL, 3, '2026-09-28 11:39:53'),
(101, '192.168.1.103', '/products', 'Products', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36', NULL, 3, '2026-09-28 11:39:57');

-- --------------------------------------------------------

--
-- Table structure for table `subcategories`
--

CREATE TABLE `subcategories` (
  `id` int(11) NOT NULL,
  `category_id` int(11) NOT NULL,
  `name` varchar(150) NOT NULL,
  `slug` varchar(180) NOT NULL,
  `image` varchar(255) DEFAULT NULL,
  `status` enum('active','inactive') NOT NULL DEFAULT 'active',
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `subcategories`
--

INSERT INTO `subcategories` (`id`, `category_id`, `name`, `slug`, `image`, `status`, `created_at`, `updated_at`) VALUES
(1, 11, 'Fast Food', 'fast-food-24696', '/uploads/1790575424686-916021583.jpeg', 'active', '2026-09-23 11:01:40', '2026-09-28 11:33:44'),
(5, 11, 'Snacks', 'snacks-00295', '/uploads/1790575400103-409986507.jpeg', 'active', '2026-09-24 11:58:25', '2026-09-28 11:33:20'),
(6, 7, 'Digital', 'digital-38697', '/uploads/1790575438674-487483262.jpeg', 'active', '2026-09-28 11:33:58', '2026-09-28 11:33:58'),
(7, 5, 'Snacks', 'snacks-55525', '/uploads/1790575455489-941643644.jpeg', 'active', '2026-09-28 11:34:15', '2026-09-28 11:34:15'),
(8, 5, 'Part time', 'part-time-79272', '/uploads/1790575479258-296674105.jpeg', 'active', '2026-09-28 11:34:39', '2026-09-28 11:34:39'),
(9, 1, 'Veg', 'veg-32417', '/uploads/1790575632315-948624917.jpg', 'active', '2026-09-28 11:37:12', '2026-09-28 11:37:12');

-- --------------------------------------------------------

--
-- Table structure for table `testimonials`
--

CREATE TABLE `testimonials` (
  `id` int(11) NOT NULL,
  `name` varchar(120) NOT NULL,
  `designation` varchar(120) DEFAULT NULL,
  `message` text NOT NULL,
  `rating` tinyint(4) NOT NULL DEFAULT 5,
  `image` varchar(255) DEFAULT NULL,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `status` enum('active','inactive') NOT NULL DEFAULT 'active',
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `testimonials`
--

INSERT INTO `testimonials` (`id`, `name`, `designation`, `message`, `rating`, `image`, `sort_order`, `status`, `created_at`, `updated_at`) VALUES
(1, 'dasdasdas', 'dasd', 'asdasdas', 5, NULL, 1, 'active', '2026-09-23 13:58:48', '2026-09-23 13:58:48');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `name` varchar(150) NOT NULL,
  `email` varchar(150) NOT NULL,
  `password` varchar(255) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `role` enum('admin','staff','customer') NOT NULL DEFAULT 'customer',
  `status` enum('active','inactive','blocked') NOT NULL DEFAULT 'active',
  `reset_token` varchar(255) DEFAULT NULL,
  `reset_token_expires` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `name`, `email`, `password`, `phone`, `role`, `status`, `reset_token`, `reset_token_expires`, `created_at`, `updated_at`) VALUES
(1, 'Super Admin', 'admin@example.com', '$2b$10$d65c/lNOauw/FIV8MP4Ime/RhcY.SqzjQuG14xlR1Ctc7llLgzfWa', '9999999999', 'admin', 'active', NULL, NULL, '2026-09-21 15:48:13', '2026-09-23 12:31:15'),
(2, 'testing', 'test@gmail.com', '$2a$10$EVvCinEkr4syzS.HyjoE6.QA31DRDmfb9IXoPEjskKP4YqCt4Yhdm', '9888888888888', 'customer', 'active', NULL, NULL, '2026-09-21 16:35:24', '2026-09-23 12:31:14'),
(3, 'vaikundarajan', 'admin@gmail.com', '$2a$10$wyQc4LWImjZxFtl7WZ5qf.bOQ.iMBx1Ei1gpOcpGZMGB3bZVfL8IK', '9976733564', 'customer', 'active', NULL, NULL, '2026-09-23 12:58:47', '2026-09-23 13:31:03'),
(7, 'Chat Me', 'chatMe1790164208411@x.com', '$2a$10$mVHqqeBwaxRIKkWxUOxpqeYtokiNtcY7xmOpbgJ9fud32gjr.Czti', NULL, 'customer', 'active', NULL, NULL, '2026-09-23 17:20:08', '2026-09-23 17:20:08'),
(8, 'Chat Other', 'chatOther1790164208827@x.com', '$2a$10$qhVJgOyeqJxGS7wjz6qB.e8fNu2AQLuHEH3ppBSCbUJb47rNtNXGq', NULL, 'customer', 'active', NULL, NULL, '2026-09-23 17:20:08', '2026-09-23 17:20:08'),
(9, 'Chat Me', 'chatMe1790164232875@x.com', '$2a$10$wnIfBvPAHuE8SPpjHTP/ZevLvskhIsoszcowSrtlLdA.Orr9FDJeK', NULL, 'customer', 'active', NULL, NULL, '2026-09-23 17:20:33', '2026-09-23 17:20:33'),
(10, 'Chat Other', 'chatOther1790164233113@x.com', '$2a$10$jM3IBUdOp9Pp4keMhsOJNOAqAJclt2.CXaS1GIDAm5l2VC13wJwDO', NULL, 'customer', 'active', NULL, NULL, '2026-09-23 17:20:33', '2026-09-23 17:20:33'),
(11, 'Chat Me', 'chatMe1790164249620@x.com', '$2a$10$2nKwp0LVFPh1myQE6O/uNOMf9lcSoyZFRJw5l6QqoPZzDQOldl1ay', NULL, 'customer', 'active', NULL, NULL, '2026-09-23 17:20:49', '2026-09-23 17:20:49'),
(12, 'Chat Other', 'chatOther1790164249901@x.com', '$2a$10$nEX2alkU4QmKcdpKdqbg4eT8ftYgV9LXTD1qPx.jfmFeZcl2YNnRq', NULL, 'customer', 'active', NULL, NULL, '2026-09-23 17:20:49', '2026-09-23 17:20:49'),
(17, 'Gem Test', 'gem1790166426350@x.com', '$2a$10$NzAcvHprv.DHsgAb32B4sOwVogZVGM.1DXnb2CwZuKPFV8FojrPYa', NULL, 'customer', 'active', NULL, NULL, '2026-09-23 17:57:06', '2026-09-23 17:57:06'),
(18, 'Gem Test', 'gem1790166557912@x.com', '$2a$10$JnDQpSmcnY7i5H3uEt0fJOG8SLRAKk1XUTsgIkeuPbWFws5F4OEGS', NULL, 'customer', 'active', NULL, NULL, '2026-09-23 17:59:18', '2026-09-23 17:59:18'),
(19, 'Gem Test', 'gem1790166684975@x.com', '$2a$10$s0p87LZy1H6b7x1cPOPb6.LMATOCwjG5aT/cw.QAru8zK0L1SI7c6', NULL, 'customer', 'active', NULL, NULL, '2026-09-23 18:01:25', '2026-09-23 18:01:25');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `about_page`
--
ALTER TABLE `about_page`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `banners`
--
ALTER TABLE `banners`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `cart_items`
--
ALTER TABLE `cart_items`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uniq_user_product` (`user_id`,`product_id`),
  ADD KEY `fk_cart_product` (`product_id`);

--
-- Indexes for table `categories`
--
ALTER TABLE `categories`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `slug` (`slug`),
  ADD UNIQUE KEY `uq_category_name` (`name`);

--
-- Indexes for table `chat_messages`
--
ALTER TABLE `chat_messages`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_chat_user` (`user_id`,`id`);

--
-- Indexes for table `contact_messages`
--
ALTER TABLE `contact_messages`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_contact_status` (`status`);

--
-- Indexes for table `orders`
--
ALTER TABLE `orders`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `order_no` (`order_no`),
  ADD KEY `fk_order_user` (`user_id`),
  ADD KEY `idx_orders_status` (`status`),
  ADD KEY `idx_orders_created` (`created_at`);

--
-- Indexes for table `order_items`
--
ALTER TABLE `order_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_orderitem_order` (`order_id`),
  ADD KEY `fk_orderitem_product` (`product_id`);

--
-- Indexes for table `order_tracking`
--
ALTER TABLE `order_tracking`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_tracking_order` (`order_id`);

--
-- Indexes for table `payment_methods`
--
ALTER TABLE `payment_methods`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `code` (`code`);

--
-- Indexes for table `products`
--
ALTER TABLE `products`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `slug` (`slug`),
  ADD UNIQUE KEY `uq_product_name` (`name`),
  ADD UNIQUE KEY `sku` (`sku`),
  ADD KEY `fk_product_subcategory` (`subcategory_id`),
  ADD KEY `idx_products_category` (`category_id`),
  ADD KEY `idx_products_highlight` (`highlight`);
ALTER TABLE `products` ADD FULLTEXT KEY `ft_product_search` (`name`,`description`);

--
-- Indexes for table `product_images`
--
ALTER TABLE `product_images`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_image_product` (`product_id`);

--
-- Indexes for table `razorpay_payments`
--
ALTER TABLE `razorpay_payments`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `razorpay_order_id` (`razorpay_order_id`),
  ADD KEY `idx_rzp_user` (`user_id`),
  ADD KEY `fk_rzp_order` (`order_id`);

--
-- Indexes for table `shop_settings`
--
ALTER TABLE `shop_settings`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `site_visits`
--
ALTER TABLE `site_visits`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_visit_ip` (`ip_address`,`id`),
  ADD KEY `idx_visit_created` (`created_at`),
  ADD KEY `fk_visit_user` (`user_id`);

--
-- Indexes for table `subcategories`
--
ALTER TABLE `subcategories`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `slug` (`slug`),
  ADD UNIQUE KEY `uq_subcategory_name` (`category_id`,`name`);

--
-- Indexes for table `testimonials`
--
ALTER TABLE `testimonials`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD UNIQUE KEY `uq_users_phone` (`phone`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `banners`
--
ALTER TABLE `banners`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `cart_items`
--
ALTER TABLE `cart_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `categories`
--
ALTER TABLE `categories`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `chat_messages`
--
ALTER TABLE `chat_messages`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=63;

--
-- AUTO_INCREMENT for table `contact_messages`
--
ALTER TABLE `contact_messages`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `orders`
--
ALTER TABLE `orders`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=26;

--
-- AUTO_INCREMENT for table `order_items`
--
ALTER TABLE `order_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT for table `order_tracking`
--
ALTER TABLE `order_tracking`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=20;

--
-- AUTO_INCREMENT for table `payment_methods`
--
ALTER TABLE `payment_methods`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `products`
--
ALTER TABLE `products`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `product_images`
--
ALTER TABLE `product_images`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=24;

--
-- AUTO_INCREMENT for table `razorpay_payments`
--
ALTER TABLE `razorpay_payments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `site_visits`
--
ALTER TABLE `site_visits`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=102;

--
-- AUTO_INCREMENT for table `subcategories`
--
ALTER TABLE `subcategories`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `testimonials`
--
ALTER TABLE `testimonials`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=22;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `cart_items`
--
ALTER TABLE `cart_items`
  ADD CONSTRAINT `fk_cart_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_cart_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `chat_messages`
--
ALTER TABLE `chat_messages`
  ADD CONSTRAINT `fk_chat_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `orders`
--
ALTER TABLE `orders`
  ADD CONSTRAINT `fk_order_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `order_items`
--
ALTER TABLE `order_items`
  ADD CONSTRAINT `fk_orderitem_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_orderitem_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`);

--
-- Constraints for table `order_tracking`
--
ALTER TABLE `order_tracking`
  ADD CONSTRAINT `fk_tracking_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `products`
--
ALTER TABLE `products`
  ADD CONSTRAINT `fk_product_category` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`),
  ADD CONSTRAINT `fk_product_subcategory` FOREIGN KEY (`subcategory_id`) REFERENCES `subcategories` (`id`);

--
-- Constraints for table `product_images`
--
ALTER TABLE `product_images`
  ADD CONSTRAINT `fk_image_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `razorpay_payments`
--
ALTER TABLE `razorpay_payments`
  ADD CONSTRAINT `fk_rzp_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_rzp_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `site_visits`
--
ALTER TABLE `site_visits`
  ADD CONSTRAINT `fk_visit_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `subcategories`
--
ALTER TABLE `subcategories`
  ADD CONSTRAINT `fk_subcat_category` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
