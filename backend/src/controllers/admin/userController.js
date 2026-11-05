// src/controllers/userController.js (admin: manage website customers / staff)
const UserModel = require('../models/userModel');

exports.list = async (req, res, next) => {
  try {
    const { role, status, search, page, limit } = req.query;
    const data = await UserModel.list({ role, status, search, page: Number(page) || 1, limit: Number(limit) || 20 });
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

exports.getById = async (req, res, next) => {
  try {
    const user = await UserModel.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: user });
  } catch (err) { next(err); }
};

exports.setStatus = async (req, res, next) => {
  try {
    const { status } = req.body; // 'active' | 'inactive' | 'blocked'
    await UserModel.setStatus(req.params.id, status);
    res.json({ success: true, message: 'User status updated' });
  } catch (err) { next(err); }
};
