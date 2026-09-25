// src/controllers/shopController.js
// Shop details: anyone can read (website), only admin can update. No create/delete - it's one row.
const ShopModel = require('../models/shopModel');
const deleteFile = require('../utils/deleteFile');

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const HTTP_URL = /^https?:\/\/\S+$/i;
const URL_FIELDS = ['map_url', 'facebook_url', 'instagram_url', 'twitter_url', 'youtube_url'];
const t = (v) => (v === undefined || v === null || String(v).trim() === '' ? null : String(v).trim());

exports.get = async (req, res, next) => {
  try {
    const shop = await ShopModel.get();
    if (!shop) return res.status(404).json({ success: false, message: 'Shop details not set up - run migration 004' });
    res.json({ success: true, data: shop });
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  const logo = req.file ? `/uploads/${req.file.filename}` : null;
  const reject = async (status, message) => {
    if (logo) await deleteFile(logo);
    return res.status(status).json({ success: false, message });
  };
  try {
    const existing = await ShopModel.get();
    if (!existing) return reject(404, 'Shop details not set up - run migration 004');

    // Fields not sent keep their current value; sending an empty value clears it
    const data = Object.fromEntries(ShopModel.FIELDS.map((f) => [f, f in req.body ? t(req.body[f]) : existing[f]]));
    if (!data.shop_name) return reject(400, 'Shop name is required');
    if (data.email && !EMAIL.test(data.email)) return reject(400, 'Please enter a valid email address');
    for (const f of URL_FIELDS) {
      if (data[f] && !HTTP_URL.test(data[f])) return reject(400, `${f.replace(/_/g, ' ')} must start with http:// or https://`);
    }
    if (data.whatsapp) data.whatsapp = data.whatsapp.replace(/[^\d+]/g, '');

    await ShopModel.update(data, logo);
    if (logo && existing.logo) await deleteFile(existing.logo);
    res.json({ success: true, message: 'Shop details updated', data: await ShopModel.get() });
  } catch (err) {
    if (logo) await deleteFile(logo);
    next(err);
  }
};
