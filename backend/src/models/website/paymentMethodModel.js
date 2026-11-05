// src/models/website/paymentMethodModel.js - payment methods for checkout, invoices and emails
const { pool } = require('../../config/db');

const PaymentMethodModel = {
  // activeOnly for the Payment page; all rows when looking up a method's display name (invoice / email)
  list: async ({ activeOnly = false } = {}) => {
    const [rows] = await pool.query(
      `SELECT * FROM payment_methods ${activeOnly ? 'WHERE is_active = 1' : ''} ORDER BY sort_order ASC, payment_method_id ASC`
    );
    return rows;
  },

  findActiveByCode: async (code) => {
    const [rows] = await pool.query('SELECT * FROM payment_methods WHERE code = ? AND is_active = 1', [code]);
    return rows[0];
  },
};

module.exports = PaymentMethodModel;
