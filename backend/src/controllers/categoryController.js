// src/controllers/categoryController.js
const CategoryModel = require('../models/categoryModel');
const SubcategoryModel = require('../models/subcategoryModel');
const slugify = require('../utils/slugify');
const deleteFile = require('../utils/deleteFile');
const ProductModel = require('../models/productModel');
const { clean, sendErrors, checkName, checkEnum } = require('../utils/validate');

// Validates the form; returns { values } or { errors } (+ 409 when the name is taken)
async function validate(body, excludeId = 0) {
  const name = clean(body.name);
  const status = body.status || 'active';
  const errors = {};
  checkName(errors, 'name', name, { label: 'Category name' });
  checkEnum(errors, 'status', status, ['active', 'inactive'], 'status');
  if (Object.keys(errors).length) return { errors, code: 422 };
  const dup = await CategoryModel.findByName(name, excludeId);
  if (dup) return { errors: { name: `A category named "${dup.name}" already exists` }, code: 409 };
  return { values: { name, status } };
}

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

exports.create = async (req, res, next) => {
  try {
    const image = req.file ? `/uploads/${req.file.filename}` : null;
    const { values, errors, code } = await validate(req.body);
    if (errors) {
      if (image) await deleteFile(image);
      return sendErrors(res, errors, code);
    }
    const { name, status } = values;
    const id = await CategoryModel.create({ name, slug: slugify(name), image, status });
    res.status(201).json({ success: true, message: 'Category created', data: { id } });
  } catch (err) {
    // Save failed (e.g. duplicate name) - don't leave the uploaded file orphaned
    if (req.file) await deleteFile(`/uploads/${req.file.filename}`);
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const image = req.file ? `/uploads/${req.file.filename}` : null;
    const existing = await CategoryModel.getById(req.params.id);
    if (!existing) {
      if (image) await deleteFile(image);
      return res.status(404).json({ success: false, message: 'Category not found' });
    }
    const { values, errors, code } = await validate(req.body, existing.id);
    if (errors) {
      if (image) await deleteFile(image);
      return sendErrors(res, errors, code);
    }
    const { name, status } = values;
    await CategoryModel.update(req.params.id, { name, slug: slugify(name), image, status });
    // New image saved - remove the old one from the uploads folder
    if (image && existing.image && existing.image !== image) await deleteFile(existing.image);
    res.json({ success: true, message: 'Category updated' });
  } catch (err) {
    if (req.file) await deleteFile(`/uploads/${req.file.filename}`);
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const existing = await CategoryModel.getById(req.params.id);
    if (!existing) return res.status(404).json({ success: false, message: 'Category not found' });
    const productCount = await ProductModel.countByCategory(req.params.id);
    if (productCount) {
      return res.status(409).json({
        success: false,
        message: `Cannot delete "${existing.name}": it has ${productCount} product${productCount > 1 ? 's' : ''}. Move or delete ${productCount > 1 ? 'them' : 'it'} first.`,
      });
    }
    // Subcategories are removed by ON DELETE CASCADE - collect their images first
    const subcategoryImages = await SubcategoryModel.getImagesByCategory(req.params.id);
    await CategoryModel.remove(req.params.id);
    await Promise.all([existing.image, ...subcategoryImages].map(deleteFile));
    res.json({ success: true, message: 'Category deleted' });
  } catch (err) { next(err); }
};
