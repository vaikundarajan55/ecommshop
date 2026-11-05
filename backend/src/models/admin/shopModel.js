// src/models/admin/shopModel.js - update shop details (single row, shop_setting_id = 1)
const { pool } = require('../../config/db');

const FIELDS = [
  'shop_name', 'tagline', 'description', 'email', 'mobile', 'alt_phone',
  'address_line', 'city', 'state', 'pincode', 'country', 'map_url', 'opening_hours', 'gstin',
  'facebook_url', 'instagram_url', 'twitter_url', 'youtube_url', 'whatsapp',
];

const ShopModel = {
  FIELDS,

  get: async () => (await pool.query('SELECT * FROM shop_settings WHERE shop_setting_id = 1'))[0][0],

  update: async (data, logo) => {
    await pool.query(
      `UPDATE shop_settings SET ${FIELDS.map((f) => `${f} = ?`).join(', ')}, logo = COALESCE(?, logo) WHERE shop_setting_id = 1`,
      [...FIELDS.map((f) => data[f] ?? null), logo]
    );
  },
};

module.exports = ShopModel;
