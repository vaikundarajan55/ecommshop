// src/controllers/bannerController.js
const { BannerModel } = require('../models/contentModel');
const makeContentController = require('./contentController');

// Only site paths ("/products") or http(s) URLs - blocks "javascript:" style links being rendered on the website
const SAFE_LINK = /^(\/(?!\/)|https?:\/\/)/i;

module.exports = makeContentController({
  Model: BannerModel,
  label: 'Banner',
  clean: (b, t) => {
    const title = t(b.title);
    if (!title) return { error: 'Title is required' };
    const link = t(b.button_link);
    if (link && !SAFE_LINK.test(link)) return { error: 'Button link must start with / or http(s)://' };
    return {
      data: {
        title,
        subtitle: t(b.subtitle),
        button_text: t(b.button_text),
        button_link: link,
        sort_order: Number(b.sort_order) || 0,
        status: b.status === 'inactive' ? 'inactive' : 'active',
      },
    };
  },
});
