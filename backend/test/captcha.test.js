// Captcha + phone/name validators - no network or database needed. Run: npm test
const test = require('node:test');
const assert = require('node:assert');
const svgCaptcha = require('svg-captcha');

// Capture the answer svg-captcha generates (the util never exposes it)
let lastText;
const realCreate = svgCaptcha.create;
svgCaptcha.create = (opts) => { const c = realCreate(opts); lastText = c.text; return c; };
const captcha = require('../src/utils/captcha');
const { normalizePhone, isMobile, checkName } = require('../src/utils/validate');

test('captcha: right answer passes, case-insensitive', () => {
  const { captchaId, svg } = captcha.create();
  assert.match(svg, /^<svg/);
  assert.strictEqual(captcha.verify(captchaId, ` ${lastText.toUpperCase()} `), true);
});

test('captcha: can only be used once', () => {
  const { captchaId } = captcha.create();
  assert.strictEqual(captcha.verify(captchaId, lastText), true);
  assert.strictEqual(captcha.verify(captchaId, lastText), false);
});

test('captcha: a wrong guess uses it up', () => {
  const { captchaId } = captcha.create();
  const answer = lastText;
  assert.strictEqual(captcha.verify(captchaId, 'wrong'), false);
  assert.strictEqual(captcha.verify(captchaId, answer), false);
});

test('captcha: unknown or missing id fails', () => {
  assert.strictEqual(captcha.verify('nope', 'abcde'), false);
  assert.strictEqual(captcha.verify(undefined, ''), false);
});

test('phone: +91 / 0 / spaces are normalised to 10 digits', () => {
  assert.strictEqual(normalizePhone('+91 98765 43210'), '9876543210');
  assert.strictEqual(normalizePhone('09876543210'), '9876543210');
  assert.strictEqual(normalizePhone('98765-43210'), '9876543210');
});

test('phone: only valid Indian mobile numbers pass', () => {
  assert.strictEqual(isMobile('9876543210'), true);
  assert.strictEqual(isMobile('5876543210'), false); // must start 6-9
  assert.strictEqual(isMobile('98765'), false);
  assert.strictEqual(isMobile('98765432101'), false);
});

test('names: letters/numbers with common punctuation only', () => {
  const errors = {};
  checkName(errors, 'a', 'Men\'s T-Shirts & Tops (2024)');
  checkName(errors, 'b', '@@');
  checkName(errors, 'c', 'x');
  assert.strictEqual(errors.a, undefined);
  assert.ok(errors.b);
  assert.ok(errors.c);
});
