// Unit tests for the Razorpay helper - no network or database needed. Run: npm test
const test = require('node:test');
const assert = require('node:assert');
const crypto = require('crypto');
const razorpay = require('../src/utils/razorpay');

const SECRET = 'test_secret_123';
const sign = (orderId, paymentId, secret = SECRET) =>
  crypto.createHmac('sha256', secret).update(`${orderId}|${paymentId}`).digest('hex');

test('accepts the signature Razorpay Checkout returns', () => {
  const signature = sign('order_TEST123', 'pay_TEST456');
  assert.strictEqual(razorpay.verifySignature({ orderId: 'order_TEST123', paymentId: 'pay_TEST456', signature }, SECRET), true);
});

test('rejects a signature made with a different secret', () => {
  const signature = sign('order_TEST123', 'pay_TEST456', 'someone_elses_secret');
  assert.strictEqual(razorpay.verifySignature({ orderId: 'order_TEST123', paymentId: 'pay_TEST456', signature }, SECRET), false);
});

test('rejects a valid signature reused for another payment or order', () => {
  const signature = sign('order_TEST123', 'pay_TEST456');
  assert.strictEqual(razorpay.verifySignature({ orderId: 'order_TEST123', paymentId: 'pay_OTHER', signature }, SECRET), false);
  assert.strictEqual(razorpay.verifySignature({ orderId: 'order_OTHER', paymentId: 'pay_TEST456', signature }, SECRET), false);
});

test('rejects missing or malformed values', () => {
  assert.strictEqual(razorpay.verifySignature({ orderId: 'order_1', paymentId: 'pay_1', signature: '' }, SECRET), false);
  assert.strictEqual(razorpay.verifySignature({ orderId: 'order_1', paymentId: 'pay_1', signature: 'abc' }, SECRET), false);
  assert.strictEqual(razorpay.verifySignature({ orderId: 'order_1', paymentId: 'pay_1', signature: sign('order_1', 'pay_1') }, ''), false);
});

test('converts rupees to paise without floating point errors', () => {
  assert.strictEqual(razorpay.toPaise(19.99), 1999);
  assert.strictEqual(razorpay.toPaise('1299.50'), 129950);
  assert.strictEqual(razorpay.toPaise(0.1 + 0.2), 30);
});

test('detects test mode from the key id', () => {
  const saved = process.env.RAZORPAY_KEY_ID;
  process.env.RAZORPAY_KEY_ID = 'rzp_test_abc';
  assert.strictEqual(razorpay.isTestMode(), true);
  process.env.RAZORPAY_KEY_ID = 'rzp_live_abc';
  assert.strictEqual(razorpay.isTestMode(), false);
  process.env.RAZORPAY_KEY_ID = saved ?? '';
});
