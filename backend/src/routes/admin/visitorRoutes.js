// Admin: website visitor log (mounted at /api/visitors)
const router = require('express').Router();
const ctrl = require('../../controllers/admin/visitorController');
const { verifyToken, isAdmin } = require('../../middlewares/authMiddleware');

const admin = [verifyToken, isAdmin];

router.get('/', ...admin, ctrl.list);
router.delete('/', ...admin, ctrl.clear);
router.get('/recent', ...admin, ctrl.recent); // before /:ip
router.get('/:ip', ...admin, ctrl.byIp);
router.delete('/:ip', ...admin, ctrl.removeIp);

module.exports = router;
