import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { ArrowRight, ShieldCheck, Truck, RotateCcw, Sparkles } from 'lucide-react';
import { imageUrl } from '../../utils/imageUrl';
import useReveal from '../../hooks/useReveal';
import ProductCard from '../../components/website/common/ProductCard';
import Bubbles from '../../components/common/Bubbles';
import BannerSlider from '../../components/website/home/BannerSlider';
import TestimonialsSection from '../../components/website/home/TestimonialsSection';
import CategorySlider from '../../components/website/home/CategorySlider';
import Carousel from '../../components/website/home/Carousel';
import useSeo from '../../hooks/useSeo';
import { fetchActiveBanners } from '../../store/slices/website/bannerSlice';
import { fetchFeaturedProducts, fetchCurrentProducts, fetchActiveCategories } from '../../store/slices/website/catalogSlice';
import { fetchTestimonials } from '../../store/slices/website/cmsSlice';

// Section that fades/slides in when it scrolls into view
function Reveal({ children, className = '', id }) {
  const [ref, visible] = useReveal();
  return (
    <section ref={ref} id={id} className={`transition-all duration-700 ease-out ${visible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'} ${className}`}>
      {visible ? children : <div className="min-h-[200px]" />}
    </section>
  );
}

function SectionTitle({ title, to, linkText }) {
  return (
    <div className="mb-5 flex items-end justify-between">
      <h2 className="text-xl font-bold text-gray-800">
        {title}
        <span className="mt-1 block h-1 w-12 animate-slideInLeft rounded-full bg-gradient-to-r from-brand-500 to-rose-500" />
      </h2>
      {to && (
        <Link to={to} className="group flex items-center gap-1 text-sm font-medium text-brand-600">
          {linkText} <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
        </Link>
      )}
    </div>
  );
}

const PERKS = [
  { icon: Truck, title: 'Fast delivery', text: 'Live order tracking' },
  { icon: ShieldCheck, title: 'Secure payments', text: 'UPI, cards & COD' },
  { icon: RotateCcw, title: 'Easy returns', text: 'Hassle-free support' },
];

export default function Home() {
  useSeo({ path: '/' });
  const dispatch = useDispatch();
  const banners = useSelector((state) => state.banners.active);
  const { featured: products, current: currentProducts, categories, featuredLoading, categoriesLoading } = useSelector((state) => state.catalog);
  const testimonials = useSelector((state) => state.cms.testimonials);
  const loading = featuredLoading || categoriesLoading;

  useEffect(() => {
    dispatch(fetchFeaturedProducts());
    dispatch(fetchActiveCategories());
    // Managed from Admin > Banners / Testimonials; failures just hide the section
    dispatch(fetchActiveBanners());
    dispatch(fetchTestimonials());
    dispatch(fetchCurrentProducts());
  }, [dispatch]);

  // Up to 3 product images float in the hero
  const heroImages = products.filter((p) => p.primary_image).slice(0, 3);
  const HERO_SLOTS = [
    'left-0 top-6 h-44 w-44 sm:h-52 sm:w-52 [--tilt:-6deg]',
    'right-0 top-0 h-36 w-36 sm:h-44 sm:w-44 [--tilt:5deg] [animation-delay:-1.5s]',
    'bottom-0 left-1/4 h-40 w-40 sm:h-48 sm:w-48 [--tilt:3deg] [animation-delay:-3s]',
  ];

  return (
    <div className="overflow-x-hidden">
      {/* ---------------- Hero: admin banners if any, otherwise the default hero ---------------- */}
      {banners.length > 0 ? <BannerSlider banners={banners} /> : (
      <section className="relative animate-gradient overflow-hidden bg-gradient-to-br from-brand-50 via-rose-50 to-amber-50 bg-[length:200%_200%]">
        <Bubbles />
        <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 md:grid-cols-2 md:py-20">
          <div className="text-center md:text-left">
            <span className="inline-flex animate-fadeInDown items-center gap-1.5 rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-brand-600 shadow-sm ring-1 ring-brand-100">
              <Sparkles size={14} /> New arrivals every week
            </span>
            <h1 className="mt-4 animate-fadeInUp text-4xl font-extrabold leading-tight text-gray-900 sm:text-5xl" style={{ animationDelay: '100ms' }}>
              Everything you need,{' '}
              <span className="animate-gradient bg-gradient-to-r from-brand-600 via-rose-500 to-amber-500 bg-[length:200%_200%] bg-clip-text text-transparent">
                delivered fast.
              </span>
            </h1>
            <p className="mt-4 animate-fadeInUp text-gray-600" style={{ animationDelay: '200ms' }}>
              Shop the latest picks across electronics, fashion, and home essentials.
            </p>
            <div className="mt-7 flex animate-fadeInUp flex-wrap justify-center gap-3 md:justify-start" style={{ animationDelay: '300ms' }}>
              <Link to="/products" className="inline-flex items-center gap-2 rounded-full bg-brand-600 px-7 py-3 text-sm font-semibold text-white">
                Shop Now <ArrowRight size={16} />
              </Link>
              <a href="#categories" className="rounded-full border border-gray-300 bg-white/70 px-6 py-3 text-sm font-semibold text-gray-700 backdrop-blur transition-colors hover:bg-white">
                Browse categories
              </a>
            </div>
          </div>

          {/* floating product images */}
          <div className="relative mx-auto hidden h-80 w-full max-w-md sm:block">
            {heroImages.length ? heroImages.map((p, i) => (
              <Link
                key={p.id} to={`/products/${p.id}`}
                className={`absolute animate-float overflow-hidden rounded-2xl border-4 border-white bg-white shadow-2xl transition-transform duration-300 hover:z-10 hover:scale-105 ${HERO_SLOTS[i]}`}
              >
                <img src={imageUrl(p.primary_image)} alt={p.name} className="h-full w-full animate-scaleIn object-cover" style={{ animationDelay: `${300 + i * 150}ms` }} />
              </Link>
            )) : (
              <div className="absolute inset-8 flex animate-float items-center justify-center rounded-3xl bg-gradient-to-br from-brand-500 to-rose-500 text-white shadow-2xl">
                <Sparkles size={64} className="animate-pulse" />
              </div>
            )}
          </div>
        </div>
      </section>
      )}

      {/* ---------------- Perks ---------------- */}
      <div className="mx-auto -mt-6 grid max-w-6xl grid-cols-1 gap-3 px-4 sm:grid-cols-3">
        {PERKS.map(({ icon: Icon, title, text }, i) => (
          <div key={title} className="relative flex animate-fadeInUp items-center gap-3 rounded-xl bg-white p-4 shadow-md ring-1 ring-gray-100 transition-transform duration-300 hover:-translate-y-1" style={{ animationDelay: `${400 + i * 100}ms` }}>
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-rose-500 text-white">
              <Icon size={20} />
            </span>
            <div>
              <p className="text-sm font-semibold text-gray-800">{title}</p>
              <p className="text-xs text-gray-500">{text}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ---------------- Categories ---------------- */}
      <Reveal id="categories" className="mx-auto max-w-6xl scroll-mt-20 px-4 pt-14">
        <SectionTitle title="Shop by Category" to="/products" linkText="All products" />
        {loading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="aspect-[4/3] animate-shimmer rounded-xl bg-gradient-to-r from-gray-100 via-gray-50 to-gray-100 bg-[length:200%_100%]" />)}
          </div>
        ) : (
          <CategorySlider categories={categories} />
        )}
      </Reveal>

      {/* ---------------- Featured products ---------------- */}
      <Reveal className="mx-auto max-w-6xl px-4 pb-16 pt-14">
        <SectionTitle title="Featured Products" to="/products" linkText="View all" />
        {loading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="aspect-[3/4] animate-shimmer rounded-xl bg-gradient-to-r from-gray-100 via-gray-50 to-gray-100 bg-[length:200%_100%]" />)}
          </div>
        ) : (
          <Carousel
            items={products} getKey={(p) => p.id} label="featured products" dotLabel={(p) => p.name} interval={3500}
            renderItem={(p, i) => <ProductCard product={p} index={i} />}
          />
        )}
        {!loading && !products.length && <p className="py-10 text-center text-sm text-gray-400">No products yet.</p>}
      </Reveal>

      {/* ---------------- Current products (marked "Current product" in admin) ---------------- */}
      {currentProducts.length > 0 && (
        <Reveal className="relative overflow-hidden bg-gradient-to-br from-rose-50 via-white to-fuchsia-50 py-14">
          <div className="mx-auto max-w-6xl px-4">
            <SectionTitle title="Current Products" to="/products" linkText="Shop all" />
            <Carousel
              items={currentProducts} getKey={(p) => p.id} label="current products" dotLabel={(p) => p.name} interval={4000}
              renderItem={(p, i) => <ProductCard product={p} index={i} />}
            />
          </div>
        </Reveal>
      )}

      <TestimonialsSection items={testimonials} />
    </div>
  );
}
