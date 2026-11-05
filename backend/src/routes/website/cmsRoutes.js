// Website: public content - banners, testimonials, About page, shop info, contact form (mounted at /api/cms)
const router = require('express').Router();
const banner = require('../../controllers/website/bannerController');
const testimonial = require('../../controllers/website/testimonialController');
const about = require('../../controllers/website/aboutController');
const contact = require('../../controllers/website/contactController');
const shop = require('../../controllers/website/shopController');

router.get('/banners', banner.listActive);
router.get('/testimonials', testimonial.listActive);
router.get('/about', about.get);
router.get('/shop', shop.get);
router.post('/contact', contact.submit);

module.exports = router;
