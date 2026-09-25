-- Names can't repeat: category names store-wide, subcategory names within their category,
-- product names store-wide. One account per mobile number. The utf8mb4 collation is
-- case-insensitive, so "Shoes" and "shoes" count as the same name.
UPDATE users SET phone = NULL WHERE TRIM(phone) = '';
ALTER TABLE users ADD UNIQUE KEY uq_users_phone (phone);
ALTER TABLE categories ADD UNIQUE KEY uq_category_name (name);
ALTER TABLE subcategories ADD UNIQUE KEY uq_subcategory_name (category_id, name);
ALTER TABLE products ADD UNIQUE KEY uq_product_name (name);
