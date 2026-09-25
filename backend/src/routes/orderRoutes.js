const router = require('express').Router();
const ctrl = require('../controllers/orderController');
const { verifyToken, isAdmin } = require('../middlewares/authMiddleware');

// Website (customer)
router.post('/', verifyToken, ctrl.createOrder);
router.get('/my', verifyToken, ctrl.myOrders);

// Shared
router.get('/:id', verifyToken, ctrl.getOrderDetail);
router.get('/:id/invoice', verifyToken, ctrl.invoice);

// Admin
router.get('/', verifyToken, isAdmin, ctrl.listOrders);
router.get('/reports/summary', verifyToken, isAdmin, ctrl.report);
router.put('/:id/status', verifyToken, isAdmin, ctrl.updateStatus);
router.put('/:id/payment', verifyToken, isAdmin, ctrl.updatePayment);

module.exports = router;
