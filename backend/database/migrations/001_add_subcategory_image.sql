-- Adds an optional image to subcategories (existing databases created before this column existed).
-- Safe to run once: MySQL errors with "Duplicate column name 'image'" if it was already applied.
ALTER TABLE subcategories ADD COLUMN image VARCHAR(255) NULL AFTER slug;
