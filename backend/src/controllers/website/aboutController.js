// src/controllers/website/aboutController.js - read the About page (single row, id = 1)
const { pool } = require('../../config/db');

exports.get = async (req, res, next) => {
  try {
    const [[about]] = await pool.query('SELECT * FROM about_page WHERE about_page_id = 1');
    if (!about) return res.status(404).json({ success: false, message: 'About page not set up - run migration 003' });
    res.json({ success: true, data: about });
  } catch (err) { next(err); }
};
