// After a successful admin change, tells every connected website tab which content changed
// so it reloads just that section (frontend: hooks/useLiveContent.js).
// Emits 'content_updated' { type, id } - id is the :id route param (null on create / single-record pages).
const { getIO } = require('../config/socket');

const broadcast = (type) => (req, res, next) => {
  res.on('finish', () => {
    if (res.statusCode < 400) getIO().emit('content_updated', { type, id: req.params.id ?? null });
  });
  next();
};

module.exports = broadcast;
