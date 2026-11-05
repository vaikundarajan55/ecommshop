// Admin: subcategory management (mounted at /api/subcategories)
const router = require('express').Router();
const ctrl = require('../../controllers/admin/subcategoryController');
const { verifyToken, isAdmin } = require('../../middlewares/authMiddleware');
const upload = require('../../middlewares/uploadMiddleware');
const broadcast = require('../../middlewares/broadcastMiddleware');

const admin = [verifyToken, isAdmin];

router.post('/', ...admin, broadcast('subcategories'), upload.single('image'), ctrl.create);
router.put('/:id', ...admin, broadcast('subcategories'), upload.single('image'), ctrl.update);
router.delete('/:id', ...admin, broadcast('subcategories'), ctrl.remove);

module.exports = router;
