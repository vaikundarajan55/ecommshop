const router = require('express').Router();
const ctrl = require('../controllers/categoryController');
const { verifyToken, isAdmin } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');

router.get('/', ctrl.getAll); // public (website needs category list too)
router.get('/:id', ctrl.getById);
router.post('/', verifyToken, isAdmin, upload.single('image'), ctrl.create);
router.put('/:id', verifyToken, isAdmin, upload.single('image'), ctrl.update);
router.delete('/:id', verifyToken, isAdmin, ctrl.remove);

module.exports = router;
