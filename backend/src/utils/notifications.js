// src/utils/notifications.js
// Customer emails. Callers don't await these - the response is sent without waiting for SMTP.
const { pool } = require('../config/db');
const { sendMail } = require('./mailer');
const templates = require('./emailTemplates');
const ShopModel = require('../models/shopModel');
const PaymentMethodModel = require('../models/paymentMethodModel');
const { OrderModel } = require('../models/orderModel');

const shopInfo = () => ShopModel.get().catch(() => null);

const send = async (to, { subject, html, text }, shop) => sendMail({ to, subject, html, text, shopName: shop?.shop_name });

// Welcome email after registration
exports.sendWelcome = async (user) => {
  try {
    const shop = await shopInfo();
    return await send(user.email, templates.welcome({ user, shop }), shop);
  } catch (err) {
    console.error('[Mail] welcome:', err.message);
    return false;
  }
};

// Order confirmation (Cash on Delivery and paid online orders)
exports.sendOrderPlaced = async (orderId) => {
  try {
    const order = await OrderModel.getById(orderId);
    if (!order?.customer_email) return false;
    const [items, shop, methods, [[eta]]] = await Promise.all([
      OrderModel.getItems(orderId),
      shopInfo(),
      PaymentMethodModel.list().catch(() => []),
      pool.query('SELECT predicted_delivery FROM order_tracking WHERE order_id = ? AND predicted_delivery IS NOT NULL ORDER BY created_at DESC LIMIT 1', [orderId]),
    ]);
    const paymentMethodName = methods.find((m) => m.code === order.payment_method)?.name;
    const mail = templates.orderPlaced({ order, items, shop, paymentMethodName, predictedDelivery: eta?.predicted_delivery });
    return await send(order.customer_email, mail, shop);
  } catch (err) {
    console.error('[Mail] order placed:', err.message);
    return false;
  }
};

// Password reset link
exports.sendPasswordReset = async (user, link) => {
  try {
    const shop = await shopInfo();
    return await send(user.email, templates.passwordReset({ user, link, shop }), shop);
  } catch (err) {
    console.error('[Mail] password reset:', err.message);
    return false;
  }
};
