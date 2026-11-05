// src/controllers/website/bannerController.js - active banners for the home page
const { BannerModel } = require('../../models/website/contentModel');

exports.listActive = async (req, res, next) => {
  try { res.json({ success: true, data: await BannerModel.listActive() }); } catch (err) { next(err); }
};
