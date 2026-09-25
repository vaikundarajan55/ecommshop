// src/controllers/orderController.js
const { OrderModel, ORDER_STATUS_FLOW, CartError } = require('../models/orderModel');
const { getIO } = require('../config/socket');
const aiClient = require('../utils/aiTrackingClient');
const { generateInvoicePDF } = require('../utils/invoiceGenerator');
const PaymentMethodModel = require('../models/paymentMethodModel');
const ShopModel = require('../models/shopModel');
const razorpay = require('../utils/razorpay');
const notifications = require('../utils/notifications');

// After any order is saved (COD here, online in paymentController): AI delivery prediction + admin alert
exports.afterOrderPlaced = async ({ orderId, orderNo, shippingAddress, itemCount, totalAmount }) => {
  // Ask the Python AI service for an initial delivery prediction (non-blocking on failure)
  const prediction = await aiClient.predictDelivery({
    order_id: orderId,
    shipping_pincode: shippingAddress?.pincode,
    item_count: itemCount,
    total_amount: totalAmount,
    order_hour: new Date().getHours(),
  });

  if (prediction?.predicted_delivery_date) {
    await OrderModel.updateStatus(orderId, 'pending', 'AI predicted delivery window generated', prediction.predicted_delivery_date);
  }

  // Notify admin dashboard in real time
  getIO().to('admin_room').emit('new_order', { orderId, orderNo, totalAmount });
  // Order confirmation email to the customer (not awaited)
  notifications.sendOrderPlaced(orderId);
  return prediction;
};

// Website: place a Cash on Delivery order (online payments go through /payments/razorpay)
exports.createOrder = async (req, res, next) => {
  try {
    const { shippingAddress, paymentMethod } = req.body;
    if (paymentMethod !== 'cod' && razorpay.isEnabled()) {
      return res.status(400).json({ success: false, message: 'Please complete the online payment to place this order.' });
    }
    // Only methods the admin has switched on in payment_methods can be used
    if (!(await PaymentMethodModel.findActiveByCode(paymentMethod))) {
      return res.status(400).json({ success: false, message: 'This payment method is not available. Please choose another one.' });
    }
    const { items, total: totalAmount } = await OrderModel.priceItems(req.body.items);
    const { orderId, orderNo } = await OrderModel.createOrder({
      userId: req.user.id, items, shippingAddress, paymentMethod, totalAmount,
    });
    const prediction = await exports.afterOrderPlaced({ orderId, orderNo, shippingAddress, itemCount: items.length, totalAmount });

    res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      data: { orderId, orderNo, prediction, totalAmount },
    });
  } catch (err) {
    if (err instanceof CartError) return res.status(400).json({ success: false, message: err.message });
    next(err);
  }
};

// Admin: list orders with filters (status, date range, search) - paginated
exports.listOrders = async (req, res, next) => {
  try {
    const { status, userId, dateFrom, dateTo, search, page, limit } = req.query;
    const data = await OrderModel.list({
      status, userId, dateFrom, dateTo, search, page: Number(page) || 1, limit: Number(limit) || 20,
    });
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

// Website: a user's own orders
exports.myOrders = async (req, res, next) => {
  try {
    const data = await OrderModel.list({ userId: req.user.id, page: Number(req.query.page) || 1, limit: 50 });
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

// Customers may only see their own orders; admin/staff can see all.
// Someone else's order answers 404 (not 403) so order ids can't be probed.
const canViewOrder = (user, order) => ['admin', 'staff'].includes(user?.role) || String(order.user_id) === String(user?.id);

exports.getOrderDetail = async (req, res, next) => {
  try {
    const order = await OrderModel.getById(req.params.id);
    if (!order || !canViewOrder(req.user, order)) return res.status(404).json({ success: false, message: 'Order not found' });
    const items = await OrderModel.getItems(req.params.id);
    const tracking = await OrderModel.getTrackingHistory(req.params.id);
    res.json({ success: true, data: { ...order, items, tracking } });
  } catch (err) { next(err); }
};

// Admin: update order status -> pushes live update over socket to the customer's order room
exports.updateStatus = async (req, res, next) => {
  try {
    const { status, note } = req.body;
    if (!ORDER_STATUS_FLOW.includes(status)) {
      return res.status(400).json({ success: false, message: `Invalid status. Allowed: ${ORDER_STATUS_FLOW.join(', ')}` });
    }

    // Let the AI service flag anomalies (e.g. status skipped, unusually long processing time)
    const anomaly = await aiClient.reportAnomaly({ order_id: req.params.id, new_status: status });

    await OrderModel.updateStatus(req.params.id, status, note);
    const tracking = await OrderModel.getTrackingHistory(req.params.id);

    getIO().to(`order_${req.params.id}`).emit('order_status_updated', {
      orderId: req.params.id, status, note, tracking, anomaly,
    });
    getIO().to('admin_room').emit('order_status_updated', { orderId: req.params.id, status });

    res.json({ success: true, message: 'Order status updated', data: { tracking, anomaly } });
  } catch (err) { next(err); }
};

exports.updatePayment = async (req, res, next) => {
  try {
    const { paymentStatus, transactionRef } = req.body;
    await OrderModel.updatePaymentStatus(req.params.id, paymentStatus, transactionRef);
    res.json({ success: true, message: 'Payment status updated' });
  } catch (err) { next(err); }
};

// Admin: filterable order report (by date range / status / grouping)
exports.report = async (req, res, next) => {
  try {
    const { dateFrom, dateTo, status, groupBy } = req.query;
    const data = await OrderModel.report({ dateFrom, dateTo, status, groupBy });
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

// Admin/Website: generate + stream a PDF invoice for an order
exports.invoice = async (req, res, next) => {
  try {
    const order = await OrderModel.getById(req.params.id);
    if (!order || !canViewOrder(req.user, order)) return res.status(404).json({ success: false, message: 'Order not found' });
    const items = await OrderModel.getItems(req.params.id);
    const methods = await PaymentMethodModel.list();
    const paymentMethodName = methods.find((m) => m.code === order.payment_method)?.name;

    // ?download=1 saves the file; otherwise browsers show it inline (preview)
    const disposition = req.query.download ? 'attachment' : 'inline';
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `${disposition}; filename="invoice-${order.order_no}.pdf"`);
    const shop = await ShopModel.get().catch(() => null);
    generateInvoicePDF(order, items, { paymentMethodName, shop }).pipe(res);
  } catch (err) { next(err); }
};
