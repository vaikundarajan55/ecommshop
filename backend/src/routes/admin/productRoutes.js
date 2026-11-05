// Admin: product management (mounted at /api/products)
const router = require('express').Router();
const ctrl = require('../../controllers/admin/productController');
const { verifyToken, isAdmin } = require('../../middlewares/authMiddleware');
const upload = require('../../middlewares/uploadMiddleware');
const broadcast = require('../../middlewares/broadcastMiddleware');

const admin = [verifyToken, isAdmin];

router.post('/', ...admin, broadcast('products'), upload.array('images', 6), ctrl.create);
router.put('/:id', ...admin, broadcast('products'), upload.array('images', 6), ctrl.update);
router.delete('/:id', ...admin, broadcast('products'), ctrl.remove);
router.delete('/:id/images/:imageId', ...admin, broadcast('products'), ctrl.removeImage);
router.put('/:id/images/:imageId/primary', ...admin, broadcast('products'), ctrl.setPrimaryImage);

module.exports = router;
