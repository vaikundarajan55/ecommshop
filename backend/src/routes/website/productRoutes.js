// Website: products, public (mounted at /api/products) - the admin product list uses the same endpoint
const router = require('express').Router();
const ctrl = require('../../controllers/website/productController');

router.get('/', ctrl.list);
router.get('/:id', ctrl.getById);

module.exports = router;
