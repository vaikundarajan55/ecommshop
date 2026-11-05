// Admin: dashboard (mounted at /api/dashboard)
const router = require('express').Router();
const ctrl = require('../../controllers/admin/dashboardController');
const { verifyToken, isAdmin } = require('../../middlewares/authMiddleware');

const admin = [verifyToken, isAdmin];

router.get('/summary', ...admin, ctrl.summary);

module.exports = router;
