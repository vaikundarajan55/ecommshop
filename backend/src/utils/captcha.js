// src/utils/captcha.js
// Image captcha for the website login. Answers stay on the server (in memory) and each
// captcha can be checked only once - a wrong password means a fresh captcha.
const crypto = require('crypto');
const svgCaptcha = require('svg-captcha');

const TTL_MS = 5 * 60 * 1000; // 5 minutes to solve it
const MAX_STORED = 20000;      // cap memory if someone requests captchas in a loop
const store = new Map();        // id -> { text, expires }

const sweep = () => {
  const now = Date.now();
  for (const [id, c] of store) if (c.expires < now) store.delete(id);
};
setInterval(sweep, 60 * 1000).unref();

exports.create = () => {
  if (store.size >= MAX_STORED) sweep();
  if (store.size >= MAX_STORED) store.delete(store.keys().next().value); // drop the oldest
  const { data: svg, text } = svgCaptcha.create({
    size: 5,
    noise: 3,
    color: true,
    background: '#fff7ed',
    ignoreChars: '0oO1iIlL', // look-alike characters
    width: 150,
    height: 50,
  });
  const id = crypto.randomUUID();
  store.set(id, { text: text.toLowerCase(), expires: Date.now() + TTL_MS });
  return { captchaId: id, svg };
};

// true only for the right answer (case-insensitive) within the time limit; the captcha is used up either way
exports.verify = (id, answer) => {
  const entry = id && store.get(id);
  if (!entry) return false;
  store.delete(id);
  if (entry.expires < Date.now()) return false;
  const a = Buffer.from(String(answer || '').trim().toLowerCase());
  const b = Buffer.from(entry.text);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
};
