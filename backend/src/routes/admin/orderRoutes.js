// Admin: order management (mounted at /api/orders)
const router = require('express').Router();
const ctrl = require('../../controllers/admin/orderController');
const { verifyToken, isAdmin } = require('../../middlewares/authMiddleware');

const admin = [verifyToken, isAdmin];

router.get('/', ...admin, ctrl.listOrders);
router.get('/reports/summary', ...admin, ctrl.report);
router.put('/:id/status', ...admin, ctrl.updateStatus);
router.put('/:id/payment', ...admin, ctrl.updatePayment);

module.exports = router;
