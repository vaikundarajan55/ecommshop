// src/controllers/website/contactController.js - public contact form
const { pool } = require('../../config/db');

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

// Submit the contact form
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
