const router = require('express').Router();
const ctrl = require('../controllers/productController');
const { verifyToken, isAdmin } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');

router.get('/', ctrl.list); // public: website product list + admin product list (same endpoint, filters differ)
router.get('/:id', ctrl.getById);
router.post('/', verifyToken, isAdmin, upload.array('images', 6), ctrl.create);
router.put('/:id', verifyToken, isAdmin, upload.array('images', 6), ctrl.update);
router.delete('/:id', verifyToken, isAdmin, ctrl.remove);
router.delete('/:id/images/:imageId', verifyToken, isAdmin, ctrl.removeImage);
router.put('/:id/images/:imageId/primary', verifyToken, isAdmin, ctrl.setPrimaryImage);

module.exports = router;
