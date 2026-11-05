// src/controllers/admin/contactController.js - contact form messages
const { pool } = require('../../config/db');

const STATUSES = ['new', 'read', 'replied'];

// All messages, optionally filtered by status
exports.list = async (req, res, next) => {
  try {
    const { status } = req.query;
    const [rows] = await pool.query(
      `SELECT * FROM contact_messages ${STATUSES.includes(status) ? 'WHERE status = ?' : ''} ORDER BY contact_message_id ASC`,
      STATUSES.includes(status) ? [status] : []
    );
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
};

exports.setStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!STATUSES.includes(status)) return res.status(400).json({ success: false, message: 'Invalid status' });
    const [r] = await pool.query('UPDATE contact_messages SET status = ? WHERE contact_message_id = ?', [status, req.params.id]);
    if (!r.affectedRows) return res.status(404).json({ success: false, message: 'Message not found' });
    res.json({ success: true, message: `Marked as ${status}` });
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    const [r] = await pool.query('DELETE FROM contact_messages WHERE contact_message_id = ?', [req.params.id]);
    if (!r.affectedRows) return res.status(404).json({ success: false, message: 'Message not found' });
    res.json({ success: true, message: 'Message deleted' });
  } catch (err) { next(err); }
};
