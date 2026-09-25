const router = require('express').Router();
const ctrl = require('../controllers/paymentMethodController');
const { verifyToken, isAdmin } = require('../middlewares/authMiddleware');

router.get('/', ctrl.listActive); // public: website Payment page
router.get('/all', verifyToken, isAdmin, ctrl.listAll);
router.put('/:id', verifyToken, isAdmin, ctrl.update);
router.put('/:id/default', verifyToken, isAdmin, ctrl.setDefault);

module.exports = router;
