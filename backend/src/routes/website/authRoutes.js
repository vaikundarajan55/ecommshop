// Auth (mounted at /api/auth) - the admin panel login uses these too
const router = require('express').Router();
const ctrl = require('../../controllers/website/authController');
const { verifyToken } = require('../../middlewares/authMiddleware');

router.post('/register', ctrl.register);
router.get('/captcha', ctrl.captcha);
router.post('/login', ctrl.login);
router.post('/forgot-password', ctrl.forgotPassword);
router.post('/forgot-change-password', ctrl.forgotChangePassword);
router.post('/change-password', verifyToken, ctrl.changePassword);
router.get('/me', verifyToken, ctrl.me);
router.put('/profile', verifyToken, ctrl.updateProfile);

module.exports = router;
