// Client-side checks that mirror backend/src/utils/validate.js, so most mistakes show
// instantly under the field. The server still re-checks everything.

export const clean = (v) => String(v ?? '').trim().replace(/\s+/g, ' ');

const NAME_PATTERN = /^[\p{L}\p{N}][\p{L}\p{N}\s&'’,.()/-]*$/u;
const PERSON_PATTERN = /^[\p{L}][\p{L}\s.'-]*$/u;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const SKU_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_-]*$/;
const MONEY_PATTERN = /^\d+(\.\d{1,2})?$/;

export const normalizePhone = (v) => {
  let digits = String(v ?? '').replace(/[\s-]/g, '');
  if (/^\+?91\d{10}$/.test(digits)) digits = digits.slice(-10);
  else if (/^0\d{10}$/.test(digits)) digits = digits.slice(1);
  return digits;
};

// Category / subcategory names
export function nameError(value, label = 'Name') {
  const v = clean(value);
  if (!v) return `${label} is required`;
  if (v.length < 2) return `${label} must be at least 2 characters`;
  if (v.length > 100) return `${label} must be 100 characters or fewer`;
  if (!NAME_PATTERN.test(v)) return `${label} can only contain letters, numbers, spaces and & - ' , . ( ) /`;
  return '';
}

// Case/space-insensitive clash with another row in `list` (excluding the row being edited)
export const findDuplicate = (list, name, excludeId, extra = () => true) => {
  const key = clean(name).toLowerCase();
  return key ? list.find((r) => r.id !== excludeId && clean(r.name).toLowerCase() === key && extra(r)) : undefined;
};

export function personNameError(value) {
  const v = clean(value);
  if (!v) return 'Full name is required';
  if (v.length < 2 || v.length > 60) return 'Name must be 2 to 60 characters';
  if (!PERSON_PATTERN.test(v)) return 'Name can only contain letters, spaces, dots and hyphens';
  return '';
}

export function emailError(value) {
  const v = clean(value);
  if (!v) return 'Email is required';
  if (v.length > 150 || !EMAIL_PATTERN.test(v)) return 'Enter a valid email address';
  return '';
}

export function phoneError(value) {
  if (!String(value ?? '').trim()) return 'Mobile number is required';
  return /^[6-9]\d{9}$/.test(normalizePhone(value)) ? '' : 'Enter a valid 10-digit mobile number';
}

// Product form -> { field: message }
export function productErrors(form) {
  const errors = {};
  if (!form.category_id) errors.category_id = 'Please select a category';
  const name = clean(form.name);
  if (!name) errors.name = 'Product name is required';
  else if (name.length < 2 || name.length > 150) errors.name = 'Product name must be 2 to 150 characters';
  else if (!/[\p{L}\p{N}]/u.test(name)) errors.name = 'Product name must contain letters or numbers';

  const sku = clean(form.sku);
  if (sku && (sku.length > 40 || !SKU_PATTERN.test(sku))) errors.sku = 'SKU can use letters, numbers, - and _ (max 40)';
  if (String(form.description ?? '').trim().length > 5000) errors.description = 'Description must be 5000 characters or fewer';

  const priceRaw = String(form.price ?? '').trim();
  const price = Number(priceRaw);
  if (!priceRaw) errors.price = 'Price is required';
  else if (!MONEY_PATTERN.test(priceRaw) || !(price > 0) || price > 10000000) errors.price = 'Enter a price between ₹0.01 and ₹1,00,00,000 (max 2 decimals)';

  const discRaw = String(form.discount_price ?? '').trim();
  if (discRaw) {
    const disc = Number(discRaw);
    if (!MONEY_PATTERN.test(discRaw) || !(disc > 0)) errors.discount_price = 'Discount price must be more than 0 (max 2 decimals)';
    else if (price > 0 && disc >= price) errors.discount_price = 'Discount price must be less than the price';
  }

  const stockRaw = String(form.stock ?? '').trim();
  if (stockRaw && !(/^\d+$/.test(stockRaw) && Number(stockRaw) <= 1000000)) errors.stock = 'Stock must be a whole number from 0 to 10,00,000';
  return errors;
}

// { errors } from an API error response (validation / duplicate), or {}
export const serverErrors = (err) => err?.response?.data?.errors || {};
