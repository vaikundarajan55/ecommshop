// src/controllers/paymentMethodController.js
const PaymentMethodModel = require('../models/paymentMethodModel');

const toBool = (v) => v === true || v === 1 || v === '1' || v === 'true';

// Website: active methods for the Payment page (default one flagged)
exports.listActive = async (req, res, next) => {
  try {
    res.json({ success: true, data: await PaymentMethodModel.list({ activeOnly: true }) });
  } catch (err) { next(err); }
};

// Admin: every method, including disabled ones
exports.listAll = async (req, res, next) => {
  try {
    res.json({ success: true, data: await PaymentMethodModel.list() });
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const method = await PaymentMethodModel.getById(req.params.id);
    if (!method) return res.status(404).json({ success: false, message: 'Payment method not found' });

    const { name, description, sort_order } = req.body;
    const isActive = req.body.is_active === undefined ? !!method.is_active : toBool(req.body.is_active);
    if (!name || !String(name).trim()) return res.status(400).json({ success: false, message: 'Name is required' });

    if (!isActive && method.is_active) {
      if (method.is_default) {
        return res.status(400).json({ success: false, message: 'This is the default method. Choose another default before turning it off.' });
      }
      if ((await PaymentMethodModel.countActive()) <= 1) {
        return res.status(400).json({ success: false, message: 'At least one payment method must stay active.' });
      }
    }

    await PaymentMethodModel.update(method.id, {
      name: String(name).trim(),
      description: description ? String(description).trim() : null,
      sort_order: sort_order ?? method.sort_order,
      is_active: isActive,
    });
    res.json({ success: true, message: 'Payment method updated' });
  } catch (err) { next(err); }
};

exports.setDefault = async (req, res, next) => {
  try {
    const method = await PaymentMethodModel.getById(req.params.id);
    if (!method) return res.status(404).json({ success: false, message: 'Payment method not found' });
    if (!method.is_active) return res.status(400).json({ success: false, message: 'Turn this method on before making it the default.' });
    await PaymentMethodModel.setDefault(method.id);
    res.json({ success: true, message: `${method.name} is now the default payment method` });
  } catch (err) { next(err); }
};
