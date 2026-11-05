// src/controllers/website/visitorController.js
// Records each website page view (the admin visitor log is in admin/visitorController)
const jwt = require('jsonwebtoken');
const { pool } = require('../../config/db');
const { getNetworkIp, isLoopback } = require('../../utils/networkIp');

// Express reports IPv4 clients as "::ffff:1.2.3.4" on a dual-stack socket.
// Visits from this same computer (127.0.0.1 / ::1) are logged under its network IP instead.
const clientIp = (req) => {
  const ip = String(req.ip || req.socket?.remoteAddress || '').replace(/^::ffff:/, '') || 'unknown';
  return isLoopback(ip) ? getNetworkIp() : ip;
};

// Logged-in customer (optional) - a missing or bad token just means an anonymous visit
const userIdFrom = (req) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded.role === 'admin' ? null : (decoded.user_id ?? decoded.id);
  } catch {
    return null;
  }
};

// Fixed website pages (see frontend App.jsx routes)
const PAGES = {
  '/': 'Home', '/about': 'About Us', '/contact': 'Contact Us', '/products': 'Products', '/cart': 'Cart',
  '/checkout': 'Checkout', '/payment': 'Payment', '/order-success': 'Order Success', '/order-failure': 'Order Failed',
  '/login': 'Login', '/register': 'Register', '/forgot-password': 'Forgot Password',
  '/forgot-change-password': 'Reset Password', '/dashboard': 'My Account', '/my-orders': 'My Orders',
  '/assistant': 'AI Assistant', '/profile': 'Profile', '/change-password': 'Change Password',
};

// "/products/12" -> "Product: Red Shirt", "/products?categoryId=3" -> "Products: Electronics"
async function pageName(url) {
  const { pathname, searchParams } = new URL(url, 'http://site.local');
  const clean = pathname.replace(/\/+$/, '') || '/';

  const product = clean.match(/^\/products\/(\d+)$/);
  if (product) {
    const [[row]] = await pool.query('SELECT name FROM products WHERE product_id = ?', [product[1]]);
    return row ? `Product: ${row.name}` : `Product #${product[1]}`;
  }
  if (clean === '/products') {
    const categoryId = searchParams.get('categoryId');
    if (/^\d+$/.test(categoryId || '')) {
      const [[row]] = await pool.query('SELECT name FROM categories WHERE category_id = ?', [categoryId]);
      if (row) return `Products: ${row.name}`;
    }
  }
  return PAGES[clean] || clean;
}

// In-memory limit so one client can't flood the table: 120 page views per 10 minutes per IP
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 120;
const hits = new Map();
const tooMany = (ip) => {
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((ts) => now - ts < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > MAX_PER_WINDOW;
};

// POST { path, referrer } - called on every page change (path includes the ?query)
exports.track = async (req, res, next) => {
  try {
    const ip = clientIp(req);
    const clean = (v, max) => String(v ?? '').trim().slice(0, max) || null;
    const path = clean(req.body.path, 255);
    if (!path || !path.startsWith('/')) return res.status(400).json({ success: false, message: 'Invalid path' });
    if (tooMany(ip)) return res.status(204).end(); // silently drop - nothing for the visitor to act on

    await pool.query(
      'INSERT INTO site_visits (ip_address, path, page_name, user_agent, referrer, user_id) VALUES (?,?,?,?,?,?)',
      [ip, path, (await pageName(path)).slice(0, 200), clean(req.headers['user-agent'], 255), clean(req.body.referrer, 255), userIdFrom(req)]
    );
    res.status(204).end();
  } catch (err) { next(err); }
};
