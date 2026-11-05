// Website: record page views (mounted at /api/visitors)
const router = require('express').Router();
const ctrl = require('../../controllers/website/visitorController');

router.post('/track', ctrl.track);

module.exports = router;
