// src/routes/admin/index.js - admin panel API (every route here is verifyToken + isAdmin)
// NOTE: admin and website routers share the same URL paths, so auth is applied per route.
// Never add router.use(verifyToken) here - it would block public website requests too.
const router = require('express').Router();

router.use('/categories', require('./categoryRoutes'));
router.use('/subcategories', require('./subcategoryRoutes'));
router.use('/products', require('./productRoutes'));
router.use('/orders', require('./orderRoutes'));
router.use('/users', require('./userRoutes'));
router.use('/dashboard', require('./dashboardRoutes'));
router.use('/payment-methods', require('./paymentMethodRoutes'));
router.use('/cms', require('./cmsRoutes'));
router.use('/visitors', require('./visitorRoutes'));

module.exports = router;
