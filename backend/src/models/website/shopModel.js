// src/models/website/shopModel.js - shop details (single row, shop_setting_id = 1) for the website, chat, invoices, emails
const { pool } = require('../../config/db');

const ShopModel = {
  get: async () => (await pool.query('SELECT * FROM shop_settings WHERE shop_setting_id = 1'))[0][0],

  // One-line address for invoices and the website
  fullAddress: (s) => [s?.address_line, s?.city, s?.state, s?.pincode].filter(Boolean).join(', '),
};

module.exports = ShopModel;
