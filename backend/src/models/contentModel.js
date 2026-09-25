// src/models/contentModel.js
// Generic model for simple admin-managed lists (banners, testimonials): sort_order + status + optional image.
const { pool } = require('../config/db');

const makeContentModel = (table, fields) => ({
  list: async ({ activeOnly = false } = {}) => {
    const [rows] = await pool.query(
      `SELECT * FROM ${table} ${activeOnly ? "WHERE status = 'active'" : ''} ORDER BY sort_order ASC, id DESC`
    );
    return rows;
  },

  getById: async (id) => {
    const [rows] = await pool.query(`SELECT * FROM ${table} WHERE id = ?`, [id]);
    return rows[0];
  },

  create: async (data) => {
    const cols = fields.filter((f) => data[f] !== undefined);
    const [result] = await pool.query(
      `INSERT INTO ${table} (${cols.join(', ')}) VALUES (${cols.map(() => '?').join(', ')})`,
      cols.map((c) => data[c])
    );
    return result.insertId;
  },

  // image uses COALESCE so an update without a new file keeps the current image
  update: async (id, data) => {
    const cols = fields.filter((f) => f !== 'image' && data[f] !== undefined);
    await pool.query(
      `UPDATE ${table} SET ${cols.map((c) => `${c} = ?`).join(', ')}, image = COALESCE(?, image) WHERE id = ?`,
      [...cols.map((c) => data[c]), data.image ?? null, id]
    );
  },

  remove: async (id) => {
    await pool.query(`DELETE FROM ${table} WHERE id = ?`, [id]);
  },
});

module.exports = {
  BannerModel: makeContentModel('banners', ['title', 'subtitle', 'image', 'button_text', 'button_link', 'sort_order', 'status']),
  TestimonialModel: makeContentModel('testimonials', ['name', 'designation', 'message', 'rating', 'image', 'sort_order', 'status']),
};
