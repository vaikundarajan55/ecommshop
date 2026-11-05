// src/controllers/admin/orderController.js - order list, status / payment updates, reports
// (order detail + invoice are shared with customers - see website/orderController)
const { OrderModel, ORDER_STATUS_FLOW } = require('../../models/admin/orderModel');
const { getIO } = require('../../config/socket');
const aiClient = require('../../utils/aiTrackingClient');

// List orders with filters (status, date range, search) - paginated
exports.listOrders = async (req, res, next) => {
  try {
    const { status, userId, dateFrom, dateTo, search, page, limit } = req.query;
    const data = await OrderModel.list({
      status, userId, dateFrom, dateTo, search, page: Number(page) || 1, limit: Number(limit) || 20,
    });
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

// Update order status -> pushes live update over socket to the customer's order room
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

// Filterable order report (by date range / status / grouping)
exports.report = async (req, res, next) => {
  try {
    const { dateFrom, dateTo, status, groupBy } = req.query;
    const data = await OrderModel.report({ dateFrom, dateTo, status, groupBy });
    res.json({ success: true, data });
  } catch (err) { next(err); }
};
