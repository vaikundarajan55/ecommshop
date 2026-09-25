-- Home page section for a product: Featured products / Current products (set on the admin product form)
ALTER TABLE products
  ADD COLUMN highlight ENUM('none','featured','current') NOT NULL DEFAULT 'none' AFTER status,
  ADD KEY idx_products_highlight (highlight);

-- sp_get_product_list gained a last parameter (p_highlight).
-- Re-run database/procedures.sql after this migration to recreate the procedure.
