// src/controllers/contactController.js
const { pool } = require('../config/db');

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const STATUSES = ['new', 'read', 'replied'];

// Simple in-memory limit for the public form: 5 messages per 15 minutes per IP
const WINDOW_MS = 15 * 60 * 1000;
const MAX_PER_WINDOW = 5;
const hits = new Map();
const tooMany = (ip) => {
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((ts) => now - ts < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > MAX_PER_WINDOW;
};

// Website: submit the contact form
exports.submit = async (req, res, next) => {
  try {
    const clean = (v, max) => String(v ?? '').trim().slice(0, max);
    const name = clean(req.body.name, 120);
    const email = clean(req.body.email, 150);
    const phone = clean(req.body.phone, 20) || null;
    const subject = clean(req.body.subject, 150);
    const message = clean(req.body.message, 2000);

    if (!name || !email || !subject || !message) return res.status(400).json({ success: false, message: 'Please fill in name, email, subject and message' });
    if (!EMAIL.test(email)) return res.status(400).json({ success: false, message: 'Please enter a valid email address' });
    if (message.length < 10) return res.status(400).json({ success: false, message: 'Message should be at least 10 characters' });
    if (tooMany(req.ip)) return res.status(429).json({ success: false, message: 'Too many messages - please try again in a few minutes' });

    await pool.query(
      'INSERT INTO contact_messages (name, email, phone, subject, message) VALUES (?,?,?,?,?)',
      [name, email, phone, subject, message]
    );
    res.status(201).json({ success: true, message: 'Thanks! Your message has been sent. We will get back to you soon.' });
  } catch (err) { next(err); }
};

// Admin: all messages, newest first
exports.list = async (req, res, next) => {
  try {
    const { status } = req.query;
    const [rows] = await pool.query(
      `SELECT * FROM contact_messages ${STATUSES.includes(status) ? 'WHERE status = ?' : ''} ORDER BY created_at DESC`,
      STATUSES.includes(status) ? [status] : []
    );
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
};

exports.setStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!STATUSES.includes(status)) return res.status(400).json({ success: false, message: 'Invalid status' });
    const [r] = await pool.query('UPDATE contact_messages SET status = ? WHERE id = ?', [status, req.params.id]);
    if (!r.affectedRows) return res.status(404).json({ success: false, message: 'Message not found' });
    res.json({ success: true, message: `Marked as ${status}` });
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    const [r] = await pool.query('DELETE FROM contact_messages WHERE id = ?', [req.params.id]);
    if (!r.affectedRows) return res.status(404).json({ success: false, message: 'Message not found' });
    res.json({ success: true, message: 'Message deleted' });
  } catch (err) { next(err); }
};
