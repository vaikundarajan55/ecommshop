// src/controllers/website/orderController.js - place COD orders, customer order list
// Order detail + invoice are also used by the admin panel (admin/staff may view any order).
const { OrderModel, CartError } = require('../../models/website/orderModel');
const { getIO } = require('../../config/socket');
const aiClient = require('../../utils/aiTrackingClient');
const { generateInvoicePDF } = require('../../utils/invoiceGenerator');
const PaymentMethodModel = require('../../models/website/paymentMethodModel');
const ShopModel = require('../../models/website/shopModel');
const razorpay = require('../../utils/razorpay');
const notifications = require('../../utils/notifications');

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
    await OrderModel.addPrediction(orderId, 'AI predicted delivery window generated', prediction.predicted_delivery_date);
  }

  // Notify admin dashboard in real time
  getIO().to('admin_room').emit('new_order', { orderId, orderNo, totalAmount });
  // Order confirmation email to the customer (not awaited)
  notifications.sendOrderPlaced(orderId);
  return prediction;
};

// Place a Cash on Delivery order (online payments go through /payments/razorpay)
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
      userId: req.user.user_id, items, shippingAddress, paymentMethod, totalAmount,
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

// A customer's own orders
exports.myOrders = async (req, res, next) => {
  try {
    const data = await OrderModel.listByUser({ userId: req.user.user_id, page: Number(req.query.page) || 1, limit: 50 });
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

// Customers may only see their own orders; admin/staff can see all.
// Someone else's order answers 404 (not 403) so order ids can't be probed.
const canViewOrder = (user, order) => ['admin', 'staff'].includes(user?.role) || String(order.user_id) === String(user?.user_id);

exports.getOrderDetail = async (req, res, next) => {
  try {
    const order = await OrderModel.getById(req.params.id);
    if (!order || !canViewOrder(req.user, order)) return res.status(404).json({ success: false, message: 'Order not found' });
    const items = await OrderModel.getItems(req.params.id);
    const tracking = await OrderModel.getTrackingHistory(req.params.id);
    res.json({ success: true, data: { ...order, items, tracking } });
  } catch (err) { next(err); }
};

// Generate + stream a PDF invoice for an order
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
