const router = require('express').Router();
const ctrl = require('../controllers/userController');
const { verifyToken, isAdmin } = require('../middlewares/authMiddleware');

router.get('/', verifyToken, isAdmin, ctrl.list);
router.get('/:id', verifyToken, isAdmin, ctrl.getById);
router.put('/:id/status', verifyToken, isAdmin, ctrl.setStatus);

module.exports = router;
