// Admin: website content - banners, testimonials, About page, shop settings, contact messages (mounted at /api/cms)
const router = require('express').Router();
const banner = require('../../controllers/admin/bannerController');
const testimonial = require('../../controllers/admin/testimonialController');
const about = require('../../controllers/admin/aboutController');
const contact = require('../../controllers/admin/contactController');
const shop = require('../../controllers/admin/shopController');
const { verifyToken, isAdmin } = require('../../middlewares/authMiddleware');
const upload = require('../../middlewares/uploadMiddleware');
const broadcast = require('../../middlewares/broadcastMiddleware');

const admin = [verifyToken, isAdmin];

router.get('/banners/all', ...admin, banner.listAll);
router.post('/banners', ...admin, broadcast('banners'), upload.single('image'), banner.create);
router.put('/banners/:id', ...admin, broadcast('banners'), upload.single('image'), banner.update);
router.delete('/banners/:id', ...admin, broadcast('banners'), banner.remove);

router.get('/testimonials/all', ...admin, testimonial.listAll);
router.post('/testimonials', ...admin, broadcast('testimonials'), upload.single('image'), testimonial.create);
router.put('/testimonials/:id', ...admin, broadcast('testimonials'), upload.single('image'), testimonial.update);
router.delete('/testimonials/:id', ...admin, broadcast('testimonials'), testimonial.remove);

router.put('/about', ...admin, broadcast('about'), upload.single('image'), about.update); // update only - no create/delete

router.put('/shop', ...admin, broadcast('shop'), upload.single('logo'), shop.update); // update only - no create/delete

router.get('/contact', ...admin, contact.list);
router.put('/contact/:id/status', ...admin, contact.setStatus);
router.delete('/contact/:id', ...admin, contact.remove);

module.exports = router;
