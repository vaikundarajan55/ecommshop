// Website AI assistant - logged-in customers only
const router = require('express').Router();
const ctrl = require('../controllers/chatController');
const { verifyToken } = require('../middlewares/authMiddleware');

router.get('/history', verifyToken, ctrl.history);
router.delete('/history', verifyToken, ctrl.clear);
router.post('/', verifyToken, ctrl.send); // streams the reply (text/event-stream)

module.exports = router;
