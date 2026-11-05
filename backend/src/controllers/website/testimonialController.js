// src/controllers/website/testimonialController.js - active testimonials for the home page
const { TestimonialModel } = require('../../models/website/contentModel');

exports.listActive = async (req, res, next) => {
  try { res.json({ success: true, data: await TestimonialModel.listActive() }); } catch (err) { next(err); }
};
