// src/models/admin/productModel.js - product create / update / delete + image management (listing uses website/productModel)
const { pool } = require('../../config/db');
const { HIGHLIGHTS } = require('../website/productModel');

const cleanHighlight = (v) => (HIGHLIGHTS.includes(v) ? v : 'none');

const ProductModel = {
  HIGHLIGHTS,

  getById: async (id) => {
    const [rows] = await pool.query('SELECT * FROM products WHERE product_id = ?', [id]);
    return rows[0];
  },

  getImages: async (productId) => {
    const [rows] = await pool.query('SELECT * FROM product_images WHERE product_id = ?', [productId]);
    return rows;
  },

  findByName: async (name, excludeId = 0) => {
    const [rows] = await pool.query('SELECT product_id, name FROM products WHERE name = ? AND product_id <> ? LIMIT 1', [name, excludeId]);
    return rows[0];
  },

  findBySku: async (sku, excludeId = 0) => {
    const [rows] = await pool.query('SELECT product_id, name FROM products WHERE sku = ? AND product_id <> ? LIMIT 1', [sku, excludeId]);
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
        price=?, discount_price=?, stock=?, status=?, highlight=? WHERE product_id=?`,
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
    const [rows] = await pool.query('SELECT * FROM product_images WHERE product_image_id = ? AND product_id = ?', [imageId, productId]);
    return rows[0];
  },

  removeImage: async (imageId) => {
    await pool.query('DELETE FROM product_images WHERE product_image_id = ?', [imageId]);
  },

  setPrimaryImage: async (productId, imageId) => {
    await pool.query('UPDATE product_images SET is_primary = (product_image_id = ?) WHERE product_id = ?', [imageId, productId]);
  },

  // Make sure a product with images always has exactly one primary (the list/cards show the primary image)
  ensurePrimaryImage: async (productId) => {
    const [rows] = await pool.query(
      'SELECT product_image_id FROM product_images WHERE product_id = ? ORDER BY is_primary DESC, product_image_id ASC LIMIT 1',
      [productId]
    );
    if (rows[0]) await ProductModel.setPrimaryImage(productId, rows[0].product_image_id);
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
    await pool.query('DELETE FROM products WHERE product_id = ?', [id]);
  },
};

module.exports = ProductModel;
