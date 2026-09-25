// Website visitor log (IP addresses) - site records page views, admin reads them
const router = require('express').Router();
const ctrl = require('../controllers/visitorController');
const { verifyToken, isAdmin } = require('../middlewares/authMiddleware');

const admin = [verifyToken, isAdmin];

router.post('/track', ctrl.track);
router.get('/', ...admin, ctrl.list);
router.delete('/', ...admin, ctrl.clear);
router.get('/recent', ...admin, ctrl.recent); // before /:ip
router.get('/:ip', ...admin, ctrl.byIp);
router.delete('/:ip', ...admin, ctrl.removeIp);

module.exports = router;
