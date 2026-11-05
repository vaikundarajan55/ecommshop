// src/models/website/userModel.js - register, login, password reset, own profile
// Admin + website users share one table, differentiated by `role` (the admin panel logs in through /auth too)
const { pool } = require('../../config/db');

const UserModel = {
  findByEmail: async (email) => {
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ? LIMIT 1', [email]);
    return rows[0];
  },

  // Another account already using this mobile number (excludeId = the user editing their own profile)
  findByPhone: async (phone, excludeId = 0) => {
    const [rows] = await pool.query('SELECT user_id FROM users WHERE phone = ? AND user_id <> ? LIMIT 1', [phone, excludeId]);
    return rows[0];
  },

  findById: async (id) => {
    const [rows] = await pool.query(
      'SELECT user_id, name, email, phone, role, status, created_at FROM users WHERE user_id = ? LIMIT 1',
      [id]
    );
    return rows[0];
  },

  create: async ({ name, email, password, phone, role }) => {
    const [result] = await pool.query(
      'INSERT INTO users (name, email, password, phone, role, status, created_at) VALUES (?,?,?,?,?,"active",NOW())',
      [name, email, password, phone, role || 'customer']
    );
    return result.insertId;
  },

  updatePassword: async (id, hashedPassword) => {
    await pool.query('UPDATE users SET password = ? WHERE user_id = ?', [hashedPassword, id]);
  },

  updateProfile: async (id, { name, phone }) => {
    await pool.query('UPDATE users SET name = ?, phone = ? WHERE user_id = ?', [name, phone, id]);
  },

  saveResetToken: async (id, token, expiresAt) => {
    await pool.query('UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE user_id = ?', [token, expiresAt, id]);
  },

  findByResetToken: async (token) => {
    const [rows] = await pool.query(
      'SELECT * FROM users WHERE reset_token = ? AND reset_token_expires > NOW() LIMIT 1',
      [token]
    );
    return rows[0];
  },
};

module.exports = UserModel;
