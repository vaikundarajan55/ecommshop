const router = require('express').Router();
const ctrl = require('../controllers/dashboardController');
const { verifyToken, isAdmin } = require('../middlewares/authMiddleware');

router.get('/summary', verifyToken, isAdmin, ctrl.summary);

module.exports = router;
