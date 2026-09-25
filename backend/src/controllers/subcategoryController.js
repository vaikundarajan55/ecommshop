// src/controllers/subcategoryController.js
const SubcategoryModel = require('../models/subcategoryModel');
const slugify = require('../utils/slugify');
const deleteFile = require('../utils/deleteFile');
const ProductModel = require('../models/productModel');
const CategoryModel = require('../models/categoryModel');
const { clean, sendErrors, checkName, checkEnum } = require('../utils/validate');

// Validates the form; returns { values } or { errors } (+ 409 when the name is taken in that category)
async function validate(body, excludeId = 0) {
  const name = clean(body.name);
  const status = body.status || 'active';
  const errors = {};
  const category = /^\d+$/.test(String(body.category_id || '')) ? await CategoryModel.getById(body.category_id) : null;
  if (!category) errors.category_id = 'Please select a category';
  checkName(errors, 'name', name, { label: 'Subcategory name' });
  checkEnum(errors, 'status', status, ['active', 'inactive'], 'status');
  if (Object.keys(errors).length) return { errors, code: 422 };
  const dup = await SubcategoryModel.findByName(category.id, name, excludeId);
  if (dup) return { errors: { name: `"${dup.name}" already exists under ${category.name}` }, code: 409 };
  return { values: { category_id: category.id, name, status } };
}

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

exports.create = async (req, res, next) => {
  try {
    const image = req.file ? `/uploads/${req.file.filename}` : null;
    const { values, errors, code } = await validate(req.body);
    if (errors) {
      if (image) await deleteFile(image);
      return sendErrors(res, errors, code);
    }
    const { category_id, name, status } = values;
    const id = await SubcategoryModel.create({ category_id, name, slug: slugify(name), image, status });
    res.status(201).json({ success: true, message: 'Subcategory created', data: { id } });
  } catch (err) {
    // Save failed (e.g. duplicate name) - don't leave the uploaded file orphaned
    if (req.file) await deleteFile(`/uploads/${req.file.filename}`);
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const image = req.file ? `/uploads/${req.file.filename}` : null;
    const existing = await SubcategoryModel.getById(req.params.id);
    if (!existing) {
      if (image) await deleteFile(image);
      return res.status(404).json({ success: false, message: 'Subcategory not found' });
    }
    const { values, errors, code } = await validate(req.body, existing.id);
    if (errors) {
      if (image) await deleteFile(image);
      return sendErrors(res, errors, code);
    }
    const { category_id, name, status } = values;
    await SubcategoryModel.update(req.params.id, { category_id, name, slug: slugify(name), image, status });
    // New image saved - remove the old one from the uploads folder
    if (image && existing.image && existing.image !== image) await deleteFile(existing.image);
    res.json({ success: true, message: 'Subcategory updated' });
  } catch (err) {
    if (req.file) await deleteFile(`/uploads/${req.file.filename}`);
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const existing = await SubcategoryModel.getById(req.params.id);
    if (!existing) return res.status(404).json({ success: false, message: 'Subcategory not found' });
    const productCount = await ProductModel.countBySubcategory(req.params.id);
    if (productCount) {
      return res.status(409).json({
        success: false,
        message: `Cannot delete "${existing.name}": ${productCount} product${productCount > 1 ? 's use' : ' uses'} this subcategory. Move or delete ${productCount > 1 ? 'them' : 'it'} first.`,
      });
    }
    await SubcategoryModel.remove(req.params.id);
    await deleteFile(existing.image);
    res.json({ success: true, message: 'Subcategory deleted' });
  } catch (err) { next(err); }
};
