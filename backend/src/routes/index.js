// src/routes/index.js - mounts the admin and website route groups under /api
// Both groups use the same URL paths (e.g. /api/products), so the frontend needs no changes.
// Admin is mounted first so its fixed paths (/banners/all, /visitors/recent, ...) are matched before website params.
const router = require('express').Router();

router.use(require('./admin'));
router.use(require('./website'));

module.exports = router;
