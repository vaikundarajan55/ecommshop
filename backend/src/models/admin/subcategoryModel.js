// src/models/admin/subcategoryModel.js - subcategory create / update / delete (listing uses website/subcategoryModel)
const { pool } = require('../../config/db');

const SubcategoryModel = {
  getById: async (id) => {
    const [rows] = await pool.query(
      `SELECT sc.*, c.name AS category_name FROM subcategories sc
       JOIN categories c ON c.category_id = sc.category_id WHERE sc.subcategory_id = ?`,
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
      'SELECT subcategory_id, name FROM subcategories WHERE category_id = ? AND name = ? AND subcategory_id <> ? LIMIT 1',
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
      'UPDATE subcategories SET category_id=?, name=?, slug=?, image=COALESCE(?, image), status=? WHERE subcategory_id=?',
      [category_id, name, slug, image, status, id]
    );
  },

  remove: async (id) => {
    await pool.query('DELETE FROM subcategories WHERE subcategory_id = ?', [id]);
  },
};

module.exports = SubcategoryModel;
