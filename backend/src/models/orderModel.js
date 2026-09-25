// src/models/orderModel.js
const { pool, callProcedure } = require('../config/db');

const ORDER_STATUS_FLOW = [
  'pending', 'confirmed', 'processing', 'packed',
  'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'returned',
];

// Thrown for cart problems the customer can fix (missing product, not enough stock)
class CartError extends Error {}

const OrderModel = {
  // Re-price cart items from the database - the browser's prices/total are never trusted.
  // Returns [{ productId, name, price, quantity }] and the total.
  priceItems: async (items) => {
    if (!Array.isArray(items) || !items.length) throw new CartError('Your cart is empty');
    const wanted = new Map();
    for (const i of items) {
      const id = Number(i.productId);
      const qty = Number(i.quantity);
      if (!Number.isInteger(id) || !Number.isInteger(qty) || qty < 1 || qty > 100) throw new CartError('Your cart has an invalid item');
      wanted.set(id, (wanted.get(id) || 0) + qty);
    }
    const [rows] = await pool.query(
      'SELECT id, name, price, discount_price, stock, status FROM products WHERE id IN (?)',
      [[...wanted.keys()]]
    );
    const byId = new Map(rows.map((r) => [r.id, r]));
    const priced = [];
    for (const [id, quantity] of wanted) {
      const p = byId.get(id);
      if (!p || p.status === 'inactive') throw new CartError('An item in your cart is no longer available');
      if (p.status === 'out_of_stock' || Number(p.stock) < quantity) throw new CartError(`Only ${Math.max(0, p.stock)} of "${p.name}" left in stock`);
      const price = Number(p.discount_price) > 0 ? Number(p.discount_price) : Number(p.price);
      priced.push({ productId: id, name: p.name, price, quantity });
    }
    const total = Math.round(priced.reduce((a, i) => a + i.price * i.quantity, 0) * 100) / 100;
    return { items: priced, total };
  },

  // Transactional order creation: order + order_items + stock decrement
  createOrder: async ({ userId, items, shippingAddress, paymentMethod, totalAmount, paymentStatus = 'pending', transactionRef = null }) => {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const orderNo = `ORD-${Date.now()}`;
      const [orderResult] = await connection.query(
        `INSERT INTO orders
          (order_no, user_id, total_amount, payment_method, payment_status, transaction_ref, status, shipping_address, created_at)
         VALUES (?,?,?,?,?,?,?,?,NOW())`,
        [orderNo, userId, totalAmount, paymentMethod, paymentStatus, transactionRef, 'pending', JSON.stringify(shippingAddress)]
      );
      const orderId = orderResult.insertId;

      for (const item of items) {
        await connection.query(
          `INSERT INTO order_items (order_id, product_id, product_name, price, quantity, subtotal)
           VALUES (?,?,?,?,?,?)`,
          [orderId, item.productId, item.name, item.price, item.quantity, item.price * item.quantity]
        );
        await connection.query(
          'UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?',
          [item.quantity, item.productId, item.quantity]
        );
      }

      await connection.query(
        `INSERT INTO order_tracking (order_id, status, note, created_at) VALUES (?,?,?,NOW())`,
        [orderId, 'pending', paymentStatus === 'paid' ? `Order placed - payment received (${transactionRef})` : 'Order placed by customer']
      );

      await connection.commit();
      return { orderId, orderNo };
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  },

  // Uses stored procedure sp_get_order_list (admin listing with filters)
  list: async ({ status, userId, dateFrom, dateTo, search, page = 1, limit = 20 }) => {
    const offset = (page - 1) * limit;
    return callProcedure('sp_get_order_list', [
      status || null, userId || null, dateFrom || null, dateTo || null, search || null, limit, offset,
    ]);
  },

  getById: async (id) => {
    const [rows] = await pool.query(
      `SELECT o.*, u.name AS customer_name, u.email AS customer_email
       FROM orders o JOIN users u ON u.id = o.user_id WHERE o.id = ?`,
      [id]
    );
    return rows[0];
  },

  getItems: async (orderId) => {
    const [rows] = await pool.query('SELECT * FROM order_items WHERE order_id = ?', [orderId]);
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
    await pool.query('UPDATE orders SET status = ?, updated_at = NOW() WHERE id = ?', [status, orderId]);
    await pool.query(
      'INSERT INTO order_tracking (order_id, status, note, predicted_delivery, created_at) VALUES (?,?,?,?,NOW())',
      [orderId, status, note || null, predictedDelivery]
    );
  },

  updatePaymentStatus: async (orderId, paymentStatus, transactionRef) => {
    await pool.query(
      'UPDATE orders SET payment_status = ?, transaction_ref = ? WHERE id = ?',
      [paymentStatus, transactionRef, orderId]
    );
  },

  // Report data via stored procedure sp_get_order_report (grouped by day/status/category etc.)
  report: async ({ dateFrom, dateTo, status, groupBy }) => {
    return callProcedure('sp_get_order_report', [dateFrom || null, dateTo || null, status || null, groupBy || 'day']);
  },
};

module.exports = { OrderModel, ORDER_STATUS_FLOW, CartError };
