// Website content: banners, testimonials, About page, contact messages
const router = require('express').Router();
const banner = require('../controllers/bannerController');
const testimonial = require('../controllers/testimonialController');
const about = require('../controllers/aboutController');
const contact = require('../controllers/contactController');
const shop = require('../controllers/shopController');
const { verifyToken, isAdmin } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');

const admin = [verifyToken, isAdmin];

router.get('/banners', banner.listActive);
router.get('/banners/all', ...admin, banner.listAll);
router.post('/banners', ...admin, upload.single('image'), banner.create);
router.put('/banners/:id', ...admin, upload.single('image'), banner.update);
router.delete('/banners/:id', ...admin, banner.remove);

router.get('/testimonials', testimonial.listActive);
router.get('/testimonials/all', ...admin, testimonial.listAll);
router.post('/testimonials', ...admin, upload.single('image'), testimonial.create);
router.put('/testimonials/:id', ...admin, upload.single('image'), testimonial.update);
router.delete('/testimonials/:id', ...admin, testimonial.remove);

router.get('/about', about.get);
router.put('/about', ...admin, upload.single('image'), about.update); // update only - no create/delete

router.get('/shop', shop.get);
router.put('/shop', ...admin, upload.single('logo'), shop.update); // update only - no create/delete

router.post('/contact', contact.submit);
router.get('/contact', ...admin, contact.list);
router.put('/contact/:id/status', ...admin, contact.setStatus);
router.delete('/contact/:id', ...admin, contact.remove);

module.exports = router;
