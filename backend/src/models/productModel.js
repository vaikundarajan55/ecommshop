// src/models/productModel.js
const { pool, callProcedure } = require('../config/db');

// Home page section a product appears in
const HIGHLIGHTS = ['none', 'featured', 'current'];
const cleanHighlight = (v) => (HIGHLIGHTS.includes(v) ? v : 'none');

const ProductModel = {
  // Uses stored procedure sp_get_product_list for filtered/paginated listing (admin + website)
  HIGHLIGHTS,

  list: async ({ categoryId, subcategoryId, search, status, minPrice, maxPrice, highlight, page = 1, limit = 20 }) => {
    const offset = (page - 1) * limit;
    return callProcedure('sp_get_product_list', [
      categoryId || null,
      subcategoryId || null,
      search || null,
      status || null,
      minPrice || null,
      maxPrice || null,
      limit,
      offset,
      HIGHLIGHTS.includes(highlight) ? highlight : null,
    ]);
  },

  getById: async (id) => {
    const [rows] = await pool.query(
      `SELECT p.*, c.name AS category_name, sc.name AS subcategory_name
       FROM products p
       LEFT JOIN categories c ON c.id = p.category_id
       LEFT JOIN subcategories sc ON sc.id = p.subcategory_id
       WHERE p.id = ?`,
      [id]
    );
    return rows[0];
  },

  getImages: async (productId) => {
    const [rows] = await pool.query('SELECT * FROM product_images WHERE product_id = ?', [productId]);
    return rows;
  },

  findByName: async (name, excludeId = 0) => {
    const [rows] = await pool.query('SELECT id, name FROM products WHERE name = ? AND id <> ? LIMIT 1', [name, excludeId]);
    return rows[0];
  },

  findBySku: async (sku, excludeId = 0) => {
    const [rows] = await pool.query('SELECT id, name FROM products WHERE sku = ? AND id <> ? LIMIT 1', [sku, excludeId]);
    return rows[0];
  },

  create: async (data) => {
    const {
      category_id, subcategory_id, name, slug, sku, description,
      price, discount_price, stock, status, highlight,
    } = data;
    const [result] = await pool.query(
      `INSERT INTO products
        (category_id, subcategory_id, name, slug, sku, description, price, discount_price, stock, status, highlight, created_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,NOW())`,
      [category_id, subcategory_id || null, name, slug, sku || null, description, price, discount_price || null, stock || 0, status || 'active', cleanHighlight(highlight)]
    );
    return result.insertId;
  },

  update: async (id, data) => {
    const {
      category_id, subcategory_id, name, slug, sku, description,
      price, discount_price, stock, status, highlight,
    } = data;
    await pool.query(
      `UPDATE products SET category_id=?, subcategory_id=?, name=?, slug=?, sku=?, description=?,
        price=?, discount_price=?, stock=?, status=?, highlight=? WHERE id=?`,
      [category_id, subcategory_id || null, name, slug, sku || null, description, price, discount_price || null, stock || 0, status, cleanHighlight(highlight), id]
    );
  },

  addImage: async (productId, imagePath, isPrimary = false) => {
    const [result] = await pool.query(
      'INSERT INTO product_images (product_id, image, is_primary) VALUES (?,?,?)',
      [productId, imagePath, isPrimary]
    );
    return result.insertId;
  },

  getImage: async (productId, imageId) => {
    const [rows] = await pool.query('SELECT * FROM product_images WHERE id = ? AND product_id = ?', [imageId, productId]);
    return rows[0];
  },

  removeImage: async (imageId) => {
    await pool.query('DELETE FROM product_images WHERE id = ?', [imageId]);
  },

  setPrimaryImage: async (productId, imageId) => {
    await pool.query('UPDATE product_images SET is_primary = (id = ?) WHERE product_id = ?', [imageId, productId]);
  },

  // Make sure a product with images always has exactly one primary (the list/cards show the primary image)
  ensurePrimaryImage: async (productId) => {
    const [rows] = await pool.query(
      'SELECT id FROM product_images WHERE product_id = ? ORDER BY is_primary DESC, id ASC LIMIT 1',
      [productId]
    );
    if (rows[0]) await ProductModel.setPrimaryImage(productId, rows[0].id);
  },

  // How many products use a category / subcategory - checked before deleting those
  countByCategory: async (categoryId) => {
    const [rows] = await pool.query('SELECT COUNT(*) AS total FROM products WHERE category_id = ?', [categoryId]);
    return rows[0].total;
  },

  countBySubcategory: async (subcategoryId) => {
    const [rows] = await pool.query('SELECT COUNT(*) AS total FROM products WHERE subcategory_id = ?', [subcategoryId]);
    return rows[0].total;
  },

  // Order lines keep a foreign key to the product, so ordered products can't be deleted
  countOrderItems: async (productId) => {
    const [rows] = await pool.query('SELECT COUNT(DISTINCT order_id) AS total FROM order_items WHERE product_id = ?', [productId]);
    return rows[0].total;
  },

  remove: async (id) => {
    await pool.query('DELETE FROM products WHERE id = ?', [id]);
  },

  decrementStock: async (productId, qty, connection = pool) => {
    await connection.query('UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?', [qty, productId, qty]);
  },
};

module.exports = ProductModel;
