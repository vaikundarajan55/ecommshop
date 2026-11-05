// Website: customer orders (mounted at /api/orders)
const router = require('express').Router();
const ctrl = require('../../controllers/website/orderController');
const { verifyToken } = require('../../middlewares/authMiddleware');

router.post('/', verifyToken, ctrl.createOrder);
router.get('/my', verifyToken, ctrl.myOrders);

// Shared with the admin panel
router.get('/:id', verifyToken, ctrl.getOrderDetail);
router.get('/:id/invoice', verifyToken, ctrl.invoice);

module.exports = router;
