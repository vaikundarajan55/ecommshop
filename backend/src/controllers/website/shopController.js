// src/controllers/website/shopController.js - public shop details (name, logo, address, social links)
const ShopModel = require('../../models/website/shopModel');

exports.get = async (req, res, next) => {
  try {
    const shop = await ShopModel.get();
    if (!shop) return res.status(404).json({ success: false, message: 'Shop details not set up - run migration 004' });
    res.json({ success: true, data: shop });
  } catch (err) { next(err); }
};
