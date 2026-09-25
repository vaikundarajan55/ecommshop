# Database Schema Overview

MySQL 8+. See `backend/database/schema.sql` for full DDL and
`backend/database/procedures.sql` for stored procedures.

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

## Stored Procedures (backend/database/procedures.sql)
- `sp_get_user_list(role, status, search, limit, offset)`
- `sp_get_product_list(category_id, subcategory_id, search, status, min_price, max_price, limit, offset)`
- `sp_get_order_list(status, user_id, date_from, date_to, search, limit, offset)`
- `sp_get_order_report(date_from, date_to, status, group_by)` — group_by: day | status | payment_method
- `sp_place_order_item(order_id, product_id, product_name, price, quantity)` — optional per-item insert path

## Order status flow
`pending → confirmed → processing → packed → shipped → out_for_delivery → delivered`
(with `cancelled` / `returned` as terminal side-states), enforced in `backend/src/models/orderModel.js`.
