// src/models/admin/paymentMethodModel.js - payment method settings
const { pool } = require('../../config/db');

const PaymentMethodModel = {
  // Every method, including disabled ones
  list: async () => {
    const [rows] = await pool.query('SELECT * FROM payment_methods ORDER BY sort_order ASC, payment_method_id ASC');
    return rows;
  },

  getById: async (id) => {
    const [rows] = await pool.query('SELECT * FROM payment_methods WHERE payment_method_id = ?', [id]);
    return rows[0];
  },

  countActive: async () => {
    const [rows] = await pool.query('SELECT COUNT(*) AS total FROM payment_methods WHERE is_active = 1');
    return rows[0].total;
  },

  update: async (id, { name, description, sort_order, is_active }) => {
    await pool.query(
      'UPDATE payment_methods SET name = ?, description = ?, sort_order = ?, is_active = ? WHERE payment_method_id = ?',
      [name, description || null, Number(sort_order) || 0, is_active ? 1 : 0, id]
    );
  },

  // Exactly one default: clear the others and set this one in a single statement
  setDefault: async (id) => {
    await pool.query('UPDATE payment_methods SET is_default = (payment_method_id = ?)', [id]);
  },
};

module.exports = PaymentMethodModel;
