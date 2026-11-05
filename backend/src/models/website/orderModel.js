// src/models/website/orderModel.js - checkout, customer orders, order detail / invoice
const { pool } = require('../../config/db');

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
      'SELECT product_id, name, price, discount_price, stock, status FROM products WHERE product_id IN (?)',
      [[...wanted.keys()]]
    );
    const byId = new Map(rows.map((r) => [r.product_id, r]));
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
          'UPDATE products SET stock = stock - ? WHERE product_id = ? AND stock >= ?',
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

  // A customer's own orders (tracking status + item count per order)
  listByUser: async ({ userId, page = 1, limit = 50 }) => {
    const lim = parseInt(limit, 10) || 50;
    const offset = (Math.max(parseInt(page, 10) || 1, 1) - 1) * lim;
    const [rows] = await pool.query(
      `SELECT o.order_id, o.order_no, o.user_id, u.name AS customer_name, u.email AS customer_email,
              o.total_amount, o.payment_method, o.payment_status, o.status,
              o.created_at, o.updated_at,
              (SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = o.order_id) AS item_count,
              (SELECT status FROM order_tracking ot WHERE ot.order_id = o.order_id ORDER BY ot.created_at DESC LIMIT 1) AS latest_tracking_status
       FROM orders o
       JOIN users u ON u.user_id = o.user_id
       WHERE o.user_id = ?
       ORDER BY o.order_id ASC
       LIMIT ? OFFSET ?`,
      [userId, lim, offset]
    );
    return rows;
  },

  // Right after an order is placed: record the AI predicted delivery window (status stays 'pending')
  addPrediction: async (orderId, note, predictedDelivery) => {
    await pool.query("UPDATE orders SET status = 'pending', updated_at = NOW() WHERE order_id = ?", [orderId]);
    await pool.query(
      "INSERT INTO order_tracking (order_id, status, note, predicted_delivery, created_at) VALUES (?, 'pending', ?, ?, NOW())",
      [orderId, note || null, predictedDelivery]
    );
  },

  getById: async (id) => {
    const [rows] = await pool.query(
      `SELECT o.*, u.name AS customer_name, u.email AS customer_email
       FROM orders o JOIN users u ON u.user_id = o.user_id WHERE o.order_id = ?`,
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
};

module.exports = { OrderModel, CartError };
