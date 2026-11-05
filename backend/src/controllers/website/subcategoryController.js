// src/controllers/website/subcategoryController.js - public subcategory reads (the admin list uses these too)
const SubcategoryModel = require('../../models/website/subcategoryModel');

exports.getAll = async (req, res, next) => {
  try {
    const data = await SubcategoryModel.getAll({ categoryId: req.query.categoryId });
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

exports.getById = async (req, res, next) => {
  try {
    const data = await SubcategoryModel.getById(req.params.id);
    if (!data) return res.status(404).json({ success: false, message: 'Subcategory not found' });
    res.json({ success: true, data });
  } catch (err) { next(err); }
};
