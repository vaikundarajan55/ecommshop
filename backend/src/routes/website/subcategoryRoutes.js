// Website: subcategories, public (mounted at /api/subcategories) - the admin list uses these too
const router = require('express').Router();
const ctrl = require('../../controllers/website/subcategoryController');

router.get('/', ctrl.getAll);
router.get('/:id', ctrl.getById);

module.exports = router;
