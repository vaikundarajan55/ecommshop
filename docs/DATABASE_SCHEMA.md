# Database Schema Overview

MySQL 8+. Everything is in one file, `backend/database/schema.sql`: tables, indexes, foreign keys and data
(no stored procedures; listing/report queries are plain SQL in the models). Every primary key is named after its table (`users.user_id`, `products.product_id`,
`orders.order_id`, ...; `razorpay_payments.payment_id`).

## Tables
- **users** — shared table for admin/staff/customers (`role` enum), password reset tokens
- **categories** — product categories
- **subcategories** — belongs to a category
- **products** — belongs to category + optional subcategory, full-text search index on name/description
- **product_images** — one-to-many images per product, `is_primary` flag
- **cart_items** — optional server-persisted cart (frontend also keeps a local Redux/localStorage cart)
- **orders** — order header: totals, payment method/status, order status, JSON shipping address
- **order_items** — line items per order (product snapshot: name/price at time of order)
- **order_tracking** — one row per status change; stores AI `predicted_delivery` per update; this is the
  source of truth for both the admin tracking modal and the customer-facing live tracker

## Order status flow
`pending → confirmed → processing → packed → shipped → out_for_delivery → delivered`
(with `cancelled` / `returned` as terminal side-states), enforced in `backend/src/models/admin/orderModel.js`.
