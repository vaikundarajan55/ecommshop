// src/utils/validate.js
// Small field validators shared by the controllers. Each check adds a message to `errors`
// (keyed by field name) so the admin/website forms can show it under the right input.

const clean = (v) => String(v ?? '').trim().replace(/\s+/g, ' ');

// Letters (any language), numbers, spaces and a few punctuation marks: & - ' , . ( ) /
const NAME_PATTERN = /^[\p{L}\p{N}][\p{L}\p{N}\s&'’,.()/-]*$/u;
const PERSON_PATTERN = /^[\p{L}][\p{L}\s.'-]*$/u;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const SKU_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_-]*$/;

// Indian mobile: 10 digits starting 6-9. Accepts spaces/dashes and a +91 / 91 / 0 prefix.
const normalizePhone = (v) => {
  let digits = String(v ?? '').replace(/[\s-]/g, '');
  if (/^\+?91\d{10}$/.test(digits)) digits = digits.slice(-10);
  else if (/^0\d{10}$/.test(digits)) digits = digits.slice(1);
  return digits;
};
const isMobile = (v) => /^[6-9]\d{9}$/.test(v);

// Sends the first message as `message` (toast) and all of them as `errors` (inline under fields)
const sendErrors = (res, errors, status = 422) =>
  res.status(status).json({ success: false, message: Object.values(errors)[0], errors });

const checkName = (errors, field, value, { label = 'Name', min = 2, max = 100 } = {}) => {
  if (!value) errors[field] = `${label} is required`;
  else if (value.length < min) errors[field] = `${label} must be at least ${min} characters`;
  else if (value.length > max) errors[field] = `${label} must be ${max} characters or fewer`;
  else if (!NAME_PATTERN.test(value)) errors[field] = `${label} can only contain letters, numbers, spaces and & - ' , . ( ) /`;
};

const checkEnum = (errors, field, value, allowed, label) => {
  if (!allowed.includes(value)) errors[field] = `Please choose a valid ${label}`;
};

module.exports = {
  clean, normalizePhone, isMobile, sendErrors, checkName, checkEnum,
  EMAIL_PATTERN, PERSON_PATTERN, SKU_PATTERN,
};
