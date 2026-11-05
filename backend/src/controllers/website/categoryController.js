// src/controllers/website/categoryController.js - public category reads (the admin list uses these too)
const CategoryModel = require('../../models/website/categoryModel');

exports.getAll = async (req, res, next) => {
  try {
    const data = await CategoryModel.getAll({ status: req.query.status });
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

exports.getById = async (req, res, next) => {
  try {
    const data = await CategoryModel.getById(req.params.id);
    if (!data) return res.status(404).json({ success: false, message: 'Category not found' });
    res.json({ success: true, data });
  } catch (err) { next(err); }
};
