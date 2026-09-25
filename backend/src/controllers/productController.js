// src/controllers/productController.js
const ProductModel = require('../models/productModel');
const slugify = require('../utils/slugify');
const deleteFile = require('../utils/deleteFile');
const CategoryModel = require('../models/categoryModel');
const SubcategoryModel = require('../models/subcategoryModel');
const { clean, sendErrors, checkEnum, SKU_PATTERN } = require('../utils/validate');

const uploadedPaths = (req) => (req.files || []).map((f) => `/uploads/${f.filename}`);

const MAX_PRICE = 10000000; // ₹1 crore
const money = (v) => (/^\d+(\.\d{1,2})?$/.test(String(v ?? '').trim()) ? Number(v) : NaN);

// Validates the product form; returns { values } or { errors, code } (409 = name/SKU already used)
async function validate(body, excludeId = 0) {
  const errors = {};
  const name = clean(body.name);
  const sku = clean(body.sku);
  const description = String(body.description ?? '').trim();
  const status = body.status || 'active';
  const highlight = body.highlight || 'none';

  const category = /^\d+$/.test(String(body.category_id || '')) ? await CategoryModel.getById(body.category_id) : null;
  if (!category) errors.category_id = 'Please select a category';
  let subcategoryId = null;
  if (body.subcategory_id) {
    const sub = /^\d+$/.test(String(body.subcategory_id)) ? await SubcategoryModel.getById(body.subcategory_id) : null;
    if (!sub || (category && sub.category_id !== category.id)) errors.subcategory_id = 'Please select a subcategory of the chosen category';
    else subcategoryId = sub.id;
  }

  if (!name) errors.name = 'Product name is required';
  else if (name.length < 2 || name.length > 150) errors.name = 'Product name must be 2 to 150 characters';
  else if (!/[\p{L}\p{N}]/u.test(name)) errors.name = 'Product name must contain letters or numbers';

  if (sku && (sku.length > 40 || !SKU_PATTERN.test(sku))) errors.sku = 'SKU can use letters, numbers, - and _ (max 40)';
  if (description.length > 5000) errors.description = 'Description must be 5000 characters or fewer';

  const price = money(body.price);
  if (String(body.price ?? '').trim() === '') errors.price = 'Price is required';
  else if (!(price > 0) || price > MAX_PRICE) errors.price = 'Enter a price between ₹0.01 and ₹1,00,00,000 (max 2 decimals)';

  let discount = null;
  if (String(body.discount_price ?? '').trim() !== '') {
    discount = money(body.discount_price);
    if (!(discount > 0)) errors.discount_price = 'Discount price must be more than 0 (max 2 decimals)';
    else if (price > 0 && discount >= price) errors.discount_price = 'Discount price must be less than the price';
  }

  const stockRaw = String(body.stock ?? '').trim();
  const stock = stockRaw === '' ? 0 : Number(stockRaw);
  if (!Number.isInteger(stock) || stock < 0 || stock > 1000000) errors.stock = 'Stock must be a whole number from 0 to 10,00,000';

  checkEnum(errors, 'status', status, ['active', 'inactive', 'out_of_stock'], 'status');
  checkEnum(errors, 'highlight', highlight, ProductModel.HIGHLIGHTS, 'home page option');
  if (Object.keys(errors).length) return { errors, code: 422 };

  const dupName = await ProductModel.findByName(name, excludeId);
  if (dupName) errors.name = `A product named "${dupName.name}" already exists`;
  const dupSku = sku && (await ProductModel.findBySku(sku, excludeId));
  if (dupSku) errors.sku = `SKU "${sku}" is already used by "${dupSku.name}"`;
  if (Object.keys(errors).length) return { errors, code: 409 };

  return {
    values: {
      category_id: category.id, subcategory_id: subcategoryId, name, sku: sku || null, description,
      price, discount_price: discount, stock, status, highlight,
    },
  };
}

exports.list = async (req, res, next) => {
  try {
    const { categoryId, subcategoryId, search, status, minPrice, maxPrice, highlight, page, limit } = req.query;
    const data = await ProductModel.list({
      categoryId, subcategoryId, search, status, minPrice, maxPrice, highlight,
      page: Number(page) || 1, limit: Number(limit) || 20,
    });
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

exports.getById = async (req, res, next) => {
  try {
    const product = await ProductModel.getById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    const images = await ProductModel.getImages(req.params.id);
    res.json({ success: true, data: { ...product, images } });
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const { values, errors, code } = await validate(req.body);
    if (errors) {
      await Promise.all(uploadedPaths(req).map(deleteFile));
      return sendErrors(res, errors, code);
    }
    const id = await ProductModel.create({ ...values, slug: slugify(values.name) });

    const paths = uploadedPaths(req);
    for (let i = 0; i < paths.length; i++) {
      await ProductModel.addImage(id, paths[i], i === 0);
    }
    res.status(201).json({ success: true, message: 'Product created', data: { id } });
  } catch (err) {
    // Save failed (e.g. duplicate SKU) - don't leave the uploaded files orphaned
    await Promise.all(uploadedPaths(req).map(deleteFile));
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const existing = await ProductModel.getById(req.params.id);
    if (!existing) {
      await Promise.all(uploadedPaths(req).map(deleteFile));
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    const { values, errors, code } = await validate(req.body, existing.id);
    if (errors) {
      await Promise.all(uploadedPaths(req).map(deleteFile));
      return sendErrors(res, errors, code);
    }
    await ProductModel.update(req.params.id, { ...values, slug: slugify(values.name) });

    for (const imagePath of uploadedPaths(req)) {
      await ProductModel.addImage(req.params.id, imagePath, false);
    }
    // Product may have had no images before - promote the first new one to primary
    if (req.files?.length) await ProductModel.ensurePrimaryImage(req.params.id);
    res.json({ success: true, message: 'Product updated' });
  } catch (err) {
    await Promise.all(uploadedPaths(req).map(deleteFile));
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const existing = await ProductModel.getById(req.params.id);
    if (!existing) return res.status(404).json({ success: false, message: 'Product not found' });
    const orderCount = await ProductModel.countOrderItems(req.params.id);
    if (orderCount) {
      return res.status(409).json({
        success: false,
        message: `Cannot delete "${existing.name}": it is part of ${orderCount} order${orderCount > 1 ? 's' : ''}. Set its status to Inactive to hide it instead.`,
      });
    }
    // product_images rows go with ON DELETE CASCADE - collect the files first
    const images = await ProductModel.getImages(req.params.id);
    await ProductModel.remove(req.params.id);
    await Promise.all(images.map((img) => deleteFile(img.image)));
    res.json({ success: true, message: 'Product deleted' });
  } catch (err) { next(err); }
};

// Admin: remove one image from a product (file + row); keeps a primary image if any remain
exports.removeImage = async (req, res, next) => {
  try {
    const image = await ProductModel.getImage(req.params.id, req.params.imageId);
    if (!image) return res.status(404).json({ success: false, message: 'Image not found' });
    await ProductModel.removeImage(image.id);
    await deleteFile(image.image);
    if (image.is_primary) await ProductModel.ensurePrimaryImage(req.params.id);
    res.json({ success: true, message: 'Image removed' });
  } catch (err) { next(err); }
};

// Admin: choose which image is shown as the product's main image
exports.setPrimaryImage = async (req, res, next) => {
  try {
    const image = await ProductModel.getImage(req.params.id, req.params.imageId);
    if (!image) return res.status(404).json({ success: false, message: 'Image not found' });
    await ProductModel.setPrimaryImage(req.params.id, image.id);
    res.json({ success: true, message: 'Main image updated' });
  } catch (err) { next(err); }
};
