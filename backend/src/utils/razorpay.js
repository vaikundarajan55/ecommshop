// src/utils/razorpay.js
// Minimal Razorpay REST client (Orders + Payments APIs) and signature check.
// Keys: https://dashboard.razorpay.com/app/website-app-settings/api-keys
// Test keys start with rzp_test_ - no real money moves in test mode.
const crypto = require('crypto');

// Demo gateway: PAYMENT_DEMO_MODE=true with no Razorpay keys shows a built-in fake payment popup,
// so checkout can be tried without an account. Never active in production.
const isDemo = () => process.env.PAYMENT_DEMO_MODE === 'true'
  && process.env.NODE_ENV !== 'production'
  && !(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
// Random per server start - demo payments are signed exactly like real Razorpay ones
const DEMO_SECRET = crypto.randomBytes(32).toString('hex');

const keyId = () => (isDemo() ? 'rzp_test_demo' : process.env.RAZORPAY_KEY_ID || '');
const keySecret = () => (isDemo() ? DEMO_SECRET : process.env.RAZORPAY_KEY_SECRET || '');
// Override only for tests / a mock server
const baseUrl = () => (process.env.RAZORPAY_API_BASE || 'https://api.razorpay.com/v1').replace(/\/$/, '');

const isEnabled = () => Boolean(keyId() && keySecret());
const isTestMode = () => keyId().startsWith('rzp_test_');

class RazorpayError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

async function call(method, path, body) {
  const res = await fetch(`${baseUrl()}${path}`, {
    method,
    headers: {
      Authorization: `Basic ${Buffer.from(`${keyId()}:${keySecret()}`).toString('base64')}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new RazorpayError(res.status, data.error?.description || `Razorpay error ${res.status}`);
  return data;
}

// amount is in paise (₹1 = 100)
const createOrder = ({ amount, receipt, notes }) =>
  call('POST', '/orders', { amount, currency: 'INR', receipt, notes, payment_capture: 1 });
const fetchPayment = (paymentId) => call('GET', `/payments/${encodeURIComponent(paymentId)}`);
const capturePayment = (paymentId, amount) =>
  call('POST', `/payments/${encodeURIComponent(paymentId)}/capture`, { amount, currency: 'INR' });

// Checkout success handler signature = HMAC_SHA256(order_id + "|" + payment_id, key_secret)
function verifySignature({ orderId, paymentId, signature }, secret = keySecret()) {
  if (!orderId || !paymentId || !signature || !secret) return false;
  const expected = crypto.createHmac('sha256', secret).update(`${orderId}|${paymentId}`).digest('hex');
  const a = Buffer.from(expected);
  const b = Buffer.from(String(signature));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

// Rupees -> integer paise without floating point drift (e.g. 19.99 -> 1999)
const toPaise = (rupees) => Math.round(Number(rupees) * 100);

// Demo gateway stand-ins for the Razorpay API calls
const demoId = (prefix) => `${prefix}_DEMO${crypto.randomBytes(7).toString('hex')}`;
const demoSign = (orderId, paymentId) => crypto.createHmac('sha256', DEMO_SECRET).update(`${orderId}|${paymentId}`).digest('hex');

module.exports = {
  keyId, isEnabled, isTestMode, isDemo, createOrder, fetchPayment, capturePayment, verifySignature, toPaise, RazorpayError,
  demoId, demoSign,
};
