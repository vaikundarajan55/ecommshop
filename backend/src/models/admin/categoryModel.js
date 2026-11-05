// src/models/admin/categoryModel.js - category create / update / delete (listing uses website/categoryModel)
const { pool } = require('../../config/db');

const CategoryModel = {
  getById: async (id) => {
    const [rows] = await pool.query('SELECT * FROM categories WHERE category_id = ?', [id]);
    return rows[0];
  },

  // Same name ignoring case/spaces (the table collation is case-insensitive); excludeId skips the row being edited
  findByName: async (name, excludeId = 0) => {
    const [rows] = await pool.query('SELECT category_id, name FROM categories WHERE name = ? AND category_id <> ? LIMIT 1', [name, excludeId]);
    return rows[0];
  },

  create: async ({ name, slug, image, status }) => {
    const [result] = await pool.query(
      'INSERT INTO categories (name, slug, image, status, created_at) VALUES (?,?,?,?,NOW())',
      [name, slug, image, status || 'active']
    );
    return result.insertId;
  },

  update: async (id, { name, slug, image, status }) => {
    await pool.query(
      'UPDATE categories SET name=?, slug=?, image=COALESCE(?, image), status=? WHERE category_id=?',
      [name, slug, image, status, id]
    );
  },

  remove: async (id) => {
    await pool.query('DELETE FROM categories WHERE category_id = ?', [id]);
  },
};

module.exports = CategoryModel;
