// Admin: payment method settings (mounted at /api/payment-methods)
const router = require('express').Router();
const ctrl = require('../../controllers/admin/paymentMethodController');
const { verifyToken, isAdmin } = require('../../middlewares/authMiddleware');

const admin = [verifyToken, isAdmin];

router.get('/all', ...admin, ctrl.listAll);
router.put('/:id', ...admin, ctrl.update);
router.put('/:id/default', ...admin, ctrl.setDefault);

module.exports = router;
