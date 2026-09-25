// src/controllers/testimonialController.js
const { TestimonialModel } = require('../models/contentModel');
const makeContentController = require('./contentController');

module.exports = makeContentController({
  Model: TestimonialModel,
  label: 'Testimonial',
  clean: (b, t) => {
    const name = t(b.name);
    const message = t(b.message);
    if (!name) return { error: 'Name is required' };
    if (!message) return { error: 'Message is required' };
    const rating = Math.round(Number(b.rating));
    return {
      data: {
        name,
        designation: t(b.designation),
        message,
        rating: rating >= 1 && rating <= 5 ? rating : 5,
        sort_order: Number(b.sort_order) || 0,
        status: b.status === 'inactive' ? 'inactive' : 'active',
      },
    };
  },
});
