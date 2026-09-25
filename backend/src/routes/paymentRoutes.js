// Online payments (Razorpay) - website Payment page
const router = require('express').Router();
const ctrl = require('../controllers/paymentController');
const { verifyToken } = require('../middlewares/authMiddleware');

router.get('/config', ctrl.config); // public: is online payment switched on + public key id
router.post('/razorpay/order', verifyToken, ctrl.createRazorpayOrder);
router.post('/razorpay/verify', verifyToken, ctrl.verifyRazorpayPayment);
router.post('/razorpay/failed', verifyToken, ctrl.razorpayFailed);
router.post('/demo/pay', verifyToken, ctrl.demoPay); // PAYMENT_DEMO_MODE only

module.exports = router;
