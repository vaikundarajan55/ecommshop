// Admin: customer accounts (mounted at /api/users)
const router = require('express').Router();
const ctrl = require('../../controllers/admin/userController');
const { verifyToken, isAdmin } = require('../../middlewares/authMiddleware');

const admin = [verifyToken, isAdmin];

router.get('/', ...admin, ctrl.list);
router.get('/:id', ...admin, ctrl.getById);
router.put('/:id/status', ...admin, ctrl.setStatus);

module.exports = router;
