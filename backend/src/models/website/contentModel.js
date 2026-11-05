// src/models/website/contentModel.js - active banners / testimonials shown on the website
const { pool } = require('../../config/db');

const makeContentModel = (table, pk) => ({
  listActive: async () => {
    const [rows] = await pool.query(`SELECT * FROM ${table} WHERE status = 'active' ORDER BY sort_order ASC, ${pk} ASC`);
    return rows;
  },
});

module.exports = {
  BannerModel: makeContentModel('banners', 'banner_id'),
  TestimonialModel: makeContentModel('testimonials', 'testimonial_id'),
};
