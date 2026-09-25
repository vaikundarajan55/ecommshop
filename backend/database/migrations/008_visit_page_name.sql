-- Readable page name for each visit ("Home", "Product: Red Shirt") shown next to the URL in admin > Visitors
ALTER TABLE site_visits ADD COLUMN page_name VARCHAR(200) NULL AFTER path;
