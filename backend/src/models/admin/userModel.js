// src/models/admin/userModel.js - customer / staff accounts (login + profile use website/userModel)
const { pool } = require('../../config/db');

const UserModel = {
  // Paginated / filterable admin user list
  list: async ({ role, status, search, page = 1, limit = 20 }) => {
    const where = [];
    const params = [];
    if (role) { where.push('role = ?'); params.push(role); }
    if (status) { where.push('status = ?'); params.push(status); }
    if (search) {
      where.push('(name LIKE ? OR email LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }
    const lim = parseInt(limit, 10) || 20;
    const offset = (Math.max(parseInt(page, 10) || 1, 1) - 1) * lim;
    const [rows] = await pool.query(
      `SELECT user_id, name, email, phone, role, status, created_at
       FROM users
       ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
       ORDER BY user_id ASC
       LIMIT ? OFFSET ?`,
      [...params, lim, offset]
    );
    return rows;
  },

  findById: async (id) => {
    const [rows] = await pool.query(
      'SELECT user_id, name, email, phone, role, status, created_at FROM users WHERE user_id = ? LIMIT 1',
      [id]
    );
    return rows[0];
  },

  setStatus: async (id, status) => {
    await pool.query('UPDATE users SET status = ? WHERE user_id = ?', [status, id]);
  },
};

module.exports = UserModel;
