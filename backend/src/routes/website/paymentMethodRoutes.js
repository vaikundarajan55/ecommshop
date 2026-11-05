// Website: active payment methods for the Payment page (mounted at /api/payment-methods)
const router = require('express').Router();
const ctrl = require('../../controllers/website/paymentMethodController');

router.get('/', ctrl.listActive);

module.exports = router;
