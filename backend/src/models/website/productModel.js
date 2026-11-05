// src/models/website/productModel.js - public product reads (the admin product list uses the same endpoint)
const { pool } = require('../../config/db');

// Home page section a product appears in (admin/productModel reuses this list)
const HIGHLIGHTS = ['none', 'featured', 'current'];

// The price a shopper actually pays (what product cards show): the discount price when set
const SELLING_PRICE = 'COALESCE(NULLIF(p.discount_price, 0), p.price)';
const SORTS = {
  price_asc: `${SELLING_PRICE} ASC, p.product_id ASC`,
  price_desc: `${SELLING_PRICE} DESC, p.product_id ASC`,
  newest: 'p.product_id DESC',
};
// Only non-negative numbers count as a price bound; anything else is ignored
const priceBound = (v) => {
  if (v === undefined || v === null || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : null;
};

const ProductModel = {
  HIGHLIGHTS,

  // Filtered / paginated product listing (admin + website). Price filters use the selling price.
  list: async ({ categoryId, subcategoryId, search, status, minPrice, maxPrice, highlight, sort, page = 1, limit = 20 }) => {
    const where = [];
    const params = [];
    const min = priceBound(minPrice);
    const max = priceBound(maxPrice);
    if (categoryId) { where.push('p.category_id = ?'); params.push(categoryId); }
    if (subcategoryId) { where.push('p.subcategory_id = ?'); params.push(subcategoryId); }
    if (status) { where.push('p.status = ?'); params.push(status); }
    if (min !== null) { where.push(`${SELLING_PRICE} >= ?`); params.push(min); }
    if (max !== null) { where.push(`${SELLING_PRICE} <= ?`); params.push(max); }
    if (HIGHLIGHTS.includes(highlight)) { where.push('p.highlight = ?'); params.push(highlight); }
    if (search) {
      where.push('(MATCH(p.name, p.description) AGAINST (? IN NATURAL LANGUAGE MODE) OR p.name LIKE ?)');
      params.push(search, `%${search}%`);
    }
    const lim = parseInt(limit, 10) || 20;
    const offset = (Math.max(parseInt(page, 10) || 1, 1) - 1) * lim;
    const [rows] = await pool.query(
      `SELECT p.*, c.name AS category_name, sc.name AS subcategory_name,
              (SELECT image FROM product_images pi WHERE pi.product_id = p.product_id AND pi.is_primary = 1 LIMIT 1) AS primary_image
       FROM products p
       LEFT JOIN categories c ON c.category_id = p.category_id
       LEFT JOIN subcategories sc ON sc.subcategory_id = p.subcategory_id
       ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
       ORDER BY ${SORTS[sort] || 'p.product_id ASC'}
       LIMIT ? OFFSET ?`,
      [...params, lim, offset]
    );
    return rows;
  },

  getById: async (id) => {
    const [rows] = await pool.query(
      `SELECT p.*, c.name AS category_name, sc.name AS subcategory_name
       FROM products p
       LEFT JOIN categories c ON c.category_id = p.category_id
       LEFT JOIN subcategories sc ON sc.subcategory_id = p.subcategory_id
       WHERE p.product_id = ?`,
      [id]
    );
    return rows[0];
  },

  getImages: async (productId) => {
    const [rows] = await pool.query('SELECT * FROM product_images WHERE product_id = ?', [productId]);
    return rows;
  },
};

module.exports = ProductModel;
