// src/controllers/website/productController.js - public product reads (the admin product list uses these too)
const ProductModel = require('../../models/website/productModel');

exports.list = async (req, res, next) => {
  try {
    const { categoryId, subcategoryId, search, status, minPrice, maxPrice, highlight, sort, page, limit } = req.query;
    const data = await ProductModel.list({
      categoryId, subcategoryId, search, status, minPrice, maxPrice, highlight, sort,
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
