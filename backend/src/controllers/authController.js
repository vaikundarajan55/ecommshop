// src/controllers/authController.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const UserModel = require('../models/userModel');
const notifications = require('../utils/notifications');
const captcha = require('../utils/captcha');
const { clean, normalizePhone, isMobile, sendErrors, EMAIL_PATTERN, PERSON_PATTERN } = require('../utils/validate');

const MIN_PASSWORD = 6;

const generateToken = (user) =>
  jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
  });

// Name + mobile rules shared by register and profile update
const checkPerson = (errors, { name, phone }) => {
  if (!name) errors.name = 'Full name is required';
  else if (name.length < 2 || name.length > 60) errors.name = 'Name must be 2 to 60 characters';
  else if (!PERSON_PATTERN.test(name)) errors.name = 'Name can only contain letters, spaces, dots and hyphens';
  if (!phone) errors.phone = 'Mobile number is required';
  else if (!isMobile(phone)) errors.phone = 'Enter a valid 10-digit mobile number';
};

exports.register = async (req, res, next) => {
  try {
    const name = clean(req.body.name);
    const email = clean(req.body.email).toLowerCase();
    const phone = normalizePhone(req.body.phone);
    const { password } = req.body;

    const errors = {};
    checkPerson(errors, { name, phone });
    if (!email) errors.email = 'Email is required';
    else if (email.length > 150 || !EMAIL_PATTERN.test(email)) errors.email = 'Enter a valid email address';
    if (!password || String(password).length < MIN_PASSWORD) errors.password = `Password must be at least ${MIN_PASSWORD} characters`;
    if (Object.keys(errors).length) return sendErrors(res, errors);

    // One account per email and per mobile number
    if (await UserModel.findByEmail(email)) errors.email = 'This email is already registered. Please sign in instead.';
    if (await UserModel.findByPhone(phone)) errors.phone = 'This mobile number is already registered with another account.';
    if (Object.keys(errors).length) return sendErrors(res, errors, 409);

    const hashed = await bcrypt.hash(password, 10);
    const userId = await UserModel.create({ name, email, password: hashed, phone, role: 'customer' });
    const user = await UserModel.findById(userId);
    const token = generateToken(user);
    notifications.sendWelcome(user); // not awaited - registration doesn't wait for the mail server

    res.status(201).json({ success: true, message: 'Registered successfully', data: { user, token } });
  } catch (err) {
    next(err);
  }
};

// Website login captcha: GET -> { captchaId, svg }
exports.captcha = (req, res) => {
  res.set('Cache-Control', 'no-store');
  res.json({ success: true, data: captcha.create() });
};

// Shared login for both admin panel and website.
// Website logins must solve the captcha. The admin panel sends portal: 'admin' and skips it,
// but then only admin/staff accounts may sign in - customers can't use it to bypass the captcha.
exports.login = async (req, res, next) => {
  try {
    const { email, password, portal, captchaId, captchaAnswer } = req.body;
    const adminPortal = portal === 'admin';
    if (!adminPortal) {
      if (!String(captchaAnswer || '').trim()) return sendErrors(res, { captcha: 'Please enter the captcha' }, 400);
      if (!captcha.verify(captchaId, captchaAnswer)) {
        return sendErrors(res, { captcha: 'Captcha is incorrect or expired. Please try the new one.' }, 400);
      }
    }

    const user = await UserModel.findByEmail(clean(email).toLowerCase());
    if (!user) return res.status(401).json({ success: false, message: 'Invalid email or password' });
    if (adminPortal && user.role !== 'admin' && user.role !== 'staff') {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
    if (user.status !== 'active') return res.status(403).json({ success: false, message: 'Account is inactive' });

    const match = await bcrypt.compare(String(password).trim(), user.password);
    if (!match) return res.status(401).json({ success: false, message: 'Invalid email or password' });

    const token = generateToken(user);
    delete user.password;

    res.json({ success: true, message: 'Login successful', data: { user, token } });
  } catch (err) {
    next(err);
  }
};

exports.changePassword = async (req, res, next) => {
  try {
    const { oldPassword, newPassword } = req.body;
    if (!newPassword || String(newPassword).length < MIN_PASSWORD) {
      return res.status(400).json({ success: false, message: `Password must be at least ${MIN_PASSWORD} characters` });
    }
    const user = await UserModel.findByEmail(req.user.email);
    const match = await bcrypt.compare(oldPassword, user.password);
    if (!match) return res.status(400).json({ success: false, message: 'Old password is incorrect' });

    const hashed = await bcrypt.hash(newPassword, 10);
    await UserModel.updatePassword(user.id, hashed);
    res.json({ success: true, message: 'Password changed successfully' });
  } catch (err) {
    next(err);
  }
};

exports.forgotPassword = async (req, res, next) => {
  try {
    const { email, portal } = req.body;
    // Same answer whether or not the account exists, so this can't be used to discover registered emails
    const genericReply = { success: true, message: 'If an account exists for this email, a reset link has been sent.' };

    const user = await UserModel.findByEmail(email);
    const isStaff = user && (user.role === 'admin' || user.role === 'staff');
    // Admin portal resets only work for admin/staff accounts, and vice versa
    if (!user || user.status !== 'active' || (portal === 'admin') !== isStaff) return res.json(genericReply);

    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await UserModel.saveResetToken(user.id, token, expires);

    const base = portal === 'admin'
      ? `${process.env.CLIENT_ADMIN_URL || 'http://localhost:5174'}/admin/reset-password`
      : `${process.env.CLIENT_WEBSITE_URL || 'http://localhost:5174'}/forgot-change-password`;
    const link = `${base}?token=${token}`;

    // The token must only ever reach the account owner's inbox - never the API response.
    notifications.sendPasswordReset(user, link);
    if (process.env.NODE_ENV === 'development') console.log(`[Auth] Password reset link for ${user.email}: ${link}`);

    res.json(genericReply);
  } catch (err) {
    next(err);
  }
};

exports.forgotChangePassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;
    if (!newPassword || String(newPassword).length < MIN_PASSWORD) {
      return res.status(400).json({ success: false, message: `Password must be at least ${MIN_PASSWORD} characters` });
    }
    const user = await UserModel.findByResetToken(token);
    if (!user) return res.status(400).json({ success: false, message: 'Invalid or expired reset token' });

    const hashed = await bcrypt.hash(newPassword, 10);
    await UserModel.updatePassword(user.id, hashed);
    await UserModel.saveResetToken(user.id, null, null);
    res.json({ success: true, message: 'Password reset successfully' });
  } catch (err) {
    next(err);
  }
};

exports.me = async (req, res, next) => {
  try {
    const user = await UserModel.findById(req.user.id);
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const name = clean(req.body.name);
    const phone = normalizePhone(req.body.phone);
    const errors = {};
    checkPerson(errors, { name, phone });
    if (Object.keys(errors).length) return sendErrors(res, errors);
    if (await UserModel.findByPhone(phone, req.user.id)) {
      return sendErrors(res, { phone: 'This mobile number is already registered with another account.' }, 409);
    }
    await UserModel.updateProfile(req.user.id, { name, phone });
    const user = await UserModel.findById(req.user.id);
    res.json({ success: true, message: 'Profile updated', data: user });
  } catch (err) {
    next(err);
  }
};
