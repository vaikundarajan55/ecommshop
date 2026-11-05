// Website: categories, public (mounted at /api/categories) - the admin list uses these too
const router = require('express').Router();
const ctrl = require('../../controllers/website/categoryController');

router.get('/', ctrl.getAll);
router.get('/:id', ctrl.getById);

module.exports = router;
