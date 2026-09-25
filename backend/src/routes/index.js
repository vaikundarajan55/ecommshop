// src/routes/index.js - mounts all route modules
const router = require('express').Router();

router.use('/auth', require('./authRoutes'));
router.use('/categories', require('./categoryRoutes'));
router.use('/subcategories', require('./subcategoryRoutes'));
router.use('/products', require('./productRoutes'));
router.use('/orders', require('./orderRoutes'));
router.use('/users', require('./userRoutes'));
router.use('/dashboard', require('./dashboardRoutes'));
router.use('/payment-methods', require('./paymentMethodRoutes'));
router.use('/payments', require('./paymentRoutes'));
router.use('/cms', require('./cmsRoutes'));
router.use('/chat', require('./chatRoutes'));
router.use('/visitors', require('./visitorRoutes'));

module.exports = router;
