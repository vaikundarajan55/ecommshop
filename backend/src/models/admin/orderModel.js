// src/models/admin/orderModel.js - order list, status / payment updates, reports (order detail + invoice use website/orderModel)
const { pool } = require('../../config/db');

const ORDER_STATUS_FLOW = [
  'pending', 'confirmed', 'processing', 'packed',
  'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'returned',
];

const OrderModel = {
  // Admin order listing with filters (tracking status + item count per order)
  list: async ({ status, userId, dateFrom, dateTo, search, page = 1, limit = 20 }) => {
    const where = [];
    const params = [];
    if (status) { where.push('o.status = ?'); params.push(status); }
    if (userId) { where.push('o.user_id = ?'); params.push(userId); }
    if (dateFrom) { where.push('DATE(o.created_at) >= ?'); params.push(dateFrom); }
    if (dateTo) { where.push('DATE(o.created_at) <= ?'); params.push(dateTo); }
    if (search) {
      where.push('(o.order_no LIKE ? OR u.name LIKE ? OR u.email LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    const lim = parseInt(limit, 10) || 20;
    const offset = (Math.max(parseInt(page, 10) || 1, 1) - 1) * lim;
    const [rows] = await pool.query(
      `SELECT o.order_id, o.order_no, o.user_id, u.name AS customer_name, u.email AS customer_email,
              o.total_amount, o.payment_method, o.payment_status, o.status,
              o.created_at, o.updated_at,
              (SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = o.order_id) AS item_count,
              (SELECT status FROM order_tracking ot WHERE ot.order_id = o.order_id ORDER BY ot.created_at DESC LIMIT 1) AS latest_tracking_status
       FROM orders o
       JOIN users u ON u.user_id = o.user_id
       ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
       ORDER BY o.order_id ASC
       LIMIT ? OFFSET ?`,
      [...params, lim, offset]
    );
    return rows;
  },

  getTrackingHistory: async (orderId) => {
    const [rows] = await pool.query(
      'SELECT * FROM order_tracking WHERE order_id = ? ORDER BY created_at ASC',
      [orderId]
    );
    return rows;
  },

  updateStatus: async (orderId, status, note, predictedDelivery = null) => {
    if (!ORDER_STATUS_FLOW.includes(status)) {
      throw new Error(`Invalid order status: ${status}`);
    }
    await pool.query('UPDATE orders SET status = ?, updated_at = NOW() WHERE order_id = ?', [status, orderId]);
    await pool.query(
      'INSERT INTO order_tracking (order_id, status, note, predicted_delivery, created_at) VALUES (?,?,?,?,NOW())',
      [orderId, status, note || null, predictedDelivery]
    );
  },

  updatePaymentStatus: async (orderId, paymentStatus, transactionRef) => {
    await pool.query(
      'UPDATE orders SET payment_status = ?, transaction_ref = ? WHERE order_id = ?',
      [paymentStatus, transactionRef, orderId]
    );
  },

  // Order report grouped by day (default) / status / payment_method
  report: async ({ dateFrom, dateTo, status, groupBy }) => {
    const groupExpr = groupBy === 'status' ? 'o.status'
      : groupBy === 'payment_method' ? 'o.payment_method'
      : 'DATE(o.created_at)';
    const orderBy = groupExpr === 'DATE(o.created_at)' ? 'group_label DESC' : 'total_orders DESC';
    const where = [];
    const params = [];
    if (dateFrom) { where.push('DATE(o.created_at) >= ?'); params.push(dateFrom); }
    if (dateTo) { where.push('DATE(o.created_at) <= ?'); params.push(dateTo); }
    if (status) { where.push('o.status = ?'); params.push(status); }
    const [rows] = await pool.query(
      `SELECT ${groupExpr} AS group_label, COUNT(*) AS total_orders, SUM(o.total_amount) AS total_revenue
       FROM orders o
       ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
       GROUP BY ${groupExpr}
       ORDER BY ${orderBy}`,
      params
    );
    return rows;
  },
};

module.exports = { OrderModel, ORDER_STATUS_FLOW };
