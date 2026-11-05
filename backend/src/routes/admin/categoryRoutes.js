// Admin: category management (mounted at /api/categories)
const router = require('express').Router();
const ctrl = require('../../controllers/admin/categoryController');
const { verifyToken, isAdmin } = require('../../middlewares/authMiddleware');
const upload = require('../../middlewares/uploadMiddleware');
const broadcast = require('../../middlewares/broadcastMiddleware');

const admin = [verifyToken, isAdmin];

router.post('/', ...admin, broadcast('categories'), upload.single('image'), ctrl.create);
router.put('/:id', ...admin, broadcast('categories'), upload.single('image'), ctrl.update);
router.delete('/:id', ...admin, broadcast('categories'), ctrl.remove);

module.exports = router;
