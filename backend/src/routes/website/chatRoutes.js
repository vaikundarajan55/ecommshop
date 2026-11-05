// Website: AI assistant - logged-in customers only (mounted at /api/chat)
const router = require('express').Router();
const ctrl = require('../../controllers/website/chatController');
const { verifyToken } = require('../../middlewares/authMiddleware');

router.get('/history', verifyToken, ctrl.history);
router.delete('/history', verifyToken, ctrl.clear);
router.post('/', verifyToken, ctrl.send); // streams the reply (text/event-stream)

module.exports = router;
