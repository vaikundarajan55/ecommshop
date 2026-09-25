// src/models/subcategoryModel.js
const { pool } = require('../config/db');

const SubcategoryModel = {
  getAll: async ({ categoryId } = {}) => {
    let sql = `SELECT sc.*, c.name AS category_name FROM subcategories sc
               JOIN categories c ON c.id = sc.category_id`;
    const params = [];
    if (categoryId) {
      sql += ' WHERE sc.category_id = ?';
      params.push(categoryId);
    }
    sql += ' ORDER BY sc.created_at DESC';
    const [rows] = await pool.query(sql, params);
    return rows;
  },

  getById: async (id) => {
    const [rows] = await pool.query(
      `SELECT sc.*, c.name AS category_name FROM subcategories sc
       JOIN categories c ON c.id = sc.category_id WHERE sc.id = ?`,
      [id]
    );
    return rows[0];
  },

  // Image paths of every subcategory under a category - used to clean up files when the category is deleted
  getImagesByCategory: async (categoryId) => {
    const [rows] = await pool.query(
      'SELECT image FROM subcategories WHERE category_id = ? AND image IS NOT NULL',
      [categoryId]
    );
    return rows.map((r) => r.image);
  },

  // Subcategory names are unique within their category
  findByName: async (categoryId, name, excludeId = 0) => {
    const [rows] = await pool.query(
      'SELECT id, name FROM subcategories WHERE category_id = ? AND name = ? AND id <> ? LIMIT 1',
      [categoryId, name, excludeId]
    );
    return rows[0];
  },

  create: async ({ category_id, name, slug, image, status }) => {
    const [result] = await pool.query(
      'INSERT INTO subcategories (category_id, name, slug, image, status, created_at) VALUES (?,?,?,?,?,NOW())',
      [category_id, name, slug, image, status || 'active']
    );
    return result.insertId;
  },

  update: async (id, { category_id, name, slug, image, status }) => {
    await pool.query(
      'UPDATE subcategories SET category_id=?, name=?, slug=?, image=COALESCE(?, image), status=? WHERE id=?',
      [category_id, name, slug, image, status, id]
    );
  },

  remove: async (id) => {
    await pool.query('DELETE FROM subcategories WHERE id = ?', [id]);
  },
};

module.exports = SubcategoryModel;
