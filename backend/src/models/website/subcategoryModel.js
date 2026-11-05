// src/models/website/subcategoryModel.js - public subcategory reads (the admin subcategory list uses these too)
const { pool } = require('../../config/db');

const SubcategoryModel = {
  getAll: async ({ categoryId } = {}) => {
    let sql = `SELECT sc.*, c.name AS category_name FROM subcategories sc
               JOIN categories c ON c.category_id = sc.category_id`;
    const params = [];
    if (categoryId) {
      sql += ' WHERE sc.category_id = ?';
      params.push(categoryId);
    }
    sql += ' ORDER BY sc.subcategory_id ASC';
    const [rows] = await pool.query(sql, params);
    return rows;
  },

  getById: async (id) => {
    const [rows] = await pool.query(
      `SELECT sc.*, c.name AS category_name FROM subcategories sc
       JOIN categories c ON c.category_id = sc.category_id WHERE sc.subcategory_id = ?`,
      [id]
    );
    return rows[0];
  },
};

module.exports = SubcategoryModel;
