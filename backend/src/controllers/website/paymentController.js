// src/controllers/paymentController.js
// Razorpay online payments for the website Payment page:
//   1. POST /payments/razorpay/order   -> prices the cart on the server, creates a Razorpay order
//   2. Browser opens Razorpay Checkout, customer pays
//   3. POST /payments/razorpay/verify  -> checks the signature + payment with Razorpay, then creates the shop order
const { pool } = require('../config/db');
const { OrderModel, CartError } = require('../models/orderModel');
const PaymentMethodModel = require('../models/paymentMethodModel');
const ShopModel = require('../models/shopModel');
const razorpay = require('../utils/razorpay');
const { afterOrderPlaced } = require('./orderController');

const ONLINE_METHODS = ['card', 'upi', 'netbanking', 'wallet'];

// Public: tells the Payment page whether to open Razorpay Checkout
exports.config = (req, res) => {
  res.json({
    success: true,
    data: {
      razorpay: razorpay.isEnabled(),
      demo: razorpay.isDemo(), // built-in fake popup instead of Razorpay Checkout
      keyId: razorpay.isEnabled() ? razorpay.keyId() : null,
      testMode: razorpay.isTestMode(),
    },
  });
};

// Step 1: POST { items, paymentMethod } -> Razorpay order for the server-calculated total
exports.createRazorpayOrder = async (req, res, next) => {
  try {
    if (!razorpay.isEnabled()) return res.status(503).json({ success: false, message: 'Online payment is not set up yet. Please choose Cash on Delivery.' });
    const { paymentMethod } = req.body;
    if (!ONLINE_METHODS.includes(paymentMethod) || !(await PaymentMethodModel.findActiveByCode(paymentMethod))) {
      return res.status(400).json({ success: false, message: 'This payment method is not available. Please choose another one.' });
    }

    const { items, total } = await OrderModel.priceItems(req.body.items);
    const amount = razorpay.toPaise(total);
    if (amount < 100) return res.status(400).json({ success: false, message: 'Online payments must be at least ₹1' });

    const rzpOrder = razorpay.isDemo()
      ? { id: razorpay.demoId('order') }
      : await razorpay.createOrder({
        amount,
        receipt: `u${req.user.id}_${Date.now()}`, // max 40 chars
        notes: { user_id: String(req.user.id) },
      });
    await pool.query(
      'INSERT INTO razorpay_payments (user_id, razorpay_order_id, amount, payment_method, items) VALUES (?,?,?,?,?)',
      [req.user.id, rzpOrder.id, total, paymentMethod, JSON.stringify(items)]
    );

    const [[user]] = await pool.query('SELECT name, email FROM users WHERE id = ?', [req.user.id]);
    const shop = await ShopModel.get().catch(() => null);
    res.status(201).json({
      success: true,
      data: {
        keyId: razorpay.keyId(),
        razorpayOrderId: rzpOrder.id,
        amount,
        currency: 'INR',
        total,
        shopName: shop?.shop_name || 'Online Store',
        customer: { name: user?.name || '', email: user?.email || '' },
      },
    });
  } catch (err) {
    if (err instanceof CartError) return res.status(400).json({ success: false, message: err.message });
    if (err instanceof razorpay.RazorpayError) {
      console.error('[Razorpay] create order:', err.status, err.message);
      return res.status(502).json({ success: false, message: 'Could not start the payment. Please try again.' });
    }
    next(err);
  }
};

// Step 3: POST { razorpay_order_id, razorpay_payment_id, razorpay_signature, shippingAddress }
exports.verifyRazorpayPayment = async (req, res, next) => {
  const { razorpay_order_id: rzpOrderId, razorpay_payment_id: paymentId, razorpay_signature: signature, shippingAddress } = req.body;
  let claimed = null;
  try {
    const [[row]] = await pool.query(
      'SELECT * FROM razorpay_payments WHERE razorpay_order_id = ? AND user_id = ?',
      [rzpOrderId, req.user.id]
    );
    if (!row) return res.status(404).json({ success: false, message: 'Payment not found' });

    // Already handled (double click / retried request) -> same answer again
    if (row.status === 'paid' && row.order_id) {
      const [[order]] = await pool.query('SELECT order_no, total_amount FROM orders WHERE id = ?', [row.order_id]);
      return res.json({ success: true, data: { orderId: row.order_id, orderNo: order?.order_no, total: Number(row.amount), paymentId: row.razorpay_payment_id } });
    }

    if (!razorpay.verifySignature({ orderId: rzpOrderId, paymentId, signature })) {
      return res.status(400).json({ success: false, message: 'Payment verification failed' });
    }

    // Only one request may turn this payment into an order
    const [claim] = await pool.query(
      "UPDATE razorpay_payments SET status = 'processing', razorpay_payment_id = ? WHERE id = ? AND status IN ('created','failed')",
      [paymentId, row.id]
    );
    if (!claim.affectedRows) return res.status(409).json({ success: false, message: 'This payment is already being processed' });
    claimed = row.id;

    // Double-check with Razorpay: right order, right amount, money actually taken
    const expected = razorpay.toPaise(row.amount);
    let payment = razorpay.isDemo()
      ? { order_id: rzpOrderId, amount: expected, status: 'captured', method: row.payment_method }
      : await razorpay.fetchPayment(paymentId);
    if (payment.order_id !== rzpOrderId || Number(payment.amount) !== expected) {
      throw new Error(`Payment ${paymentId} does not match order ${rzpOrderId}`);
    }
    if (payment.status === 'authorized') payment = await razorpay.capturePayment(paymentId, expected);
    if (payment.status !== 'captured') throw new Error(`Payment ${paymentId} status is ${payment.status}`);

    const items = typeof row.items === 'string' ? JSON.parse(row.items) : row.items;
    const method = ONLINE_METHODS.includes(payment.method) ? payment.method : row.payment_method; // what they actually paid with
    const totalAmount = Number(row.amount);
    const { orderId, orderNo } = await OrderModel.createOrder({
      userId: req.user.id, items, shippingAddress, paymentMethod: method, totalAmount,
      paymentStatus: 'paid', transactionRef: paymentId,
    });
    await pool.query("UPDATE razorpay_payments SET status = 'paid', order_id = ?, error = NULL WHERE id = ?", [orderId, row.id]);
    await afterOrderPlaced({ orderId, orderNo, shippingAddress, itemCount: items.length, totalAmount });

    res.status(201).json({ success: true, message: 'Payment received - order placed', data: { orderId, orderNo, total: totalAmount, method, paymentId } });
  } catch (err) {
    if (claimed) {
      // Payment may have been taken - keep the payment id so admin can find it in the Razorpay dashboard
      await pool.query("UPDATE razorpay_payments SET status = 'failed', error = ? WHERE id = ?", [String(err.message).slice(0, 255), claimed]).catch(() => {});
      console.error('[Razorpay] verify:', err.message);
      return res.status(502).json({ success: false, message: `We could not confirm your payment. If money was deducted, please contact support with payment ID ${paymentId}.` });
    }
    next(err);
  }
};

// Demo gateway only: POST { razorpay_order_id, method, outcome: 'success' | 'failure' }
// Answers like Razorpay Checkout's success handler, so the normal /verify step places the order.
exports.demoPay = async (req, res, next) => {
  try {
    if (!razorpay.isDemo()) return res.status(404).json({ success: false, message: 'Not found' });
    const { razorpay_order_id: rzpOrderId, method, outcome } = req.body;
    const [[row]] = await pool.query(
      "SELECT id FROM razorpay_payments WHERE razorpay_order_id = ? AND user_id = ? AND status IN ('created','failed')",
      [rzpOrderId, req.user.id]
    );
    if (!row) return res.status(404).json({ success: false, message: 'Payment not found' });

    if (outcome === 'failure') {
      await pool.query("UPDATE razorpay_payments SET status = 'failed', error = ? WHERE id = ?", ['Declined by bank (demo)', row.id]);
      return res.status(402).json({ success: false, message: 'Payment declined by the bank (demo). Try again or pick another method.' });
    }
    if (ONLINE_METHODS.includes(method)) await pool.query('UPDATE razorpay_payments SET payment_method = ? WHERE id = ?', [method, row.id]);

    const paymentId = razorpay.demoId('pay');
    res.json({
      success: true,
      data: { razorpay_order_id: rzpOrderId, razorpay_payment_id: paymentId, razorpay_signature: razorpay.demoSign(rzpOrderId, paymentId) },
    });
  } catch (err) { next(err); }
};

// POST { razorpay_order_id, error } - Checkout reported a failed attempt (customer can still retry in the popup)
exports.razorpayFailed = async (req, res, next) => {
  try {
    const reason = String(req.body.error?.description || req.body.error || 'Payment failed').slice(0, 255);
    await pool.query(
      "UPDATE razorpay_payments SET status = 'failed', error = ? WHERE razorpay_order_id = ? AND user_id = ? AND status = 'created'",
      [reason, req.body.razorpay_order_id, req.user.id]
    );
    res.json({ success: true });
  } catch (err) { next(err); }
};
