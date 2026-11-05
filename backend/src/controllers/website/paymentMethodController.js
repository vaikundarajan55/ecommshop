// src/controllers/website/paymentMethodController.js - active methods for the Payment page
const PaymentMethodModel = require('../../models/website/paymentMethodModel');

// Active methods only (default one flagged)
exports.listActive = async (req, res, next) => {
  try {
    res.json({ success: true, data: await PaymentMethodModel.list({ activeOnly: true }) });
  } catch (err) { next(err); }
};
