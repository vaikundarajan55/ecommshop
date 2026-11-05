// src/models/website/categoryModel.js - public category reads (the admin category list uses these too)
const { pool } = require('../../config/db');

const CategoryModel = {
  getAll: async ({ status } = {}) => {
    let sql = 'SELECT * FROM categories';
    const params = [];
    if (status) {
      sql += ' WHERE status = ?';
      params.push(status);
    }
    sql += ' ORDER BY category_id ASC';
    const [rows] = await pool.query(sql, params);
    return rows;
  },

  getById: async (id) => {
    const [rows] = await pool.query('SELECT * FROM categories WHERE category_id = ?', [id]);
    return rows[0];
  },
};

module.exports = CategoryModel;
