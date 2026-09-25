import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Package, ImageOff, Minus, Plus, ShoppingCart, Check, PackageCheck, PackageX, Truck, ShieldCheck, RotateCcw, Loader2,
} from 'lucide-react';
import { notify } from '../../utils/notify';
import { addToCart } from '../../store/slices/website/cartSlice';
import { fetchProductById } from '../../store/slices/website/catalogSlice';
import { imageUrl } from '../../utils/imageUrl';
import useSeo from '../../hooks/useSeo';
import PageHero from '../../components/website/common/PageHero';

const money = (v) => `₹${Number(v || 0).toLocaleString('en-IN')}`;

export default function ProductView() {
  const { id } = useParams();
  const [loaded, setLoaded] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [active, setActive] = useState(0);
  const [qty, setQty] = useState(1);
  const [justAdded, setJustAdded] = useState(false);
  const dispatch = useDispatch();
  const cached = useSelector((s) => s.catalog.details[id]);
  const product = loaded ? cached : null; // always show fresh price / stock

  useEffect(() => {
    setLoaded(false); setNotFound(false); setActive(0); setQty(1);
    dispatch(fetchProductById(id)).unwrap()
      .then(() => setLoaded(true))
      .catch(() => setNotFound(true));
  }, [dispatch, id]);

  // Product structured data lets search engines show price/stock in results
  const images = (product?.images || []).map((i) => imageUrl(i.image));
  useSeo({
    title: product?.name || 'Product',
    description: product?.description || (product ? `Buy ${product.name} online at ShopEase.` : undefined),
    image: images[0],
    path: `/products/${id}`,
    noindex: notFound,
    jsonLd: product && {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.name,
      description: product.description || undefined,
      image: images.length ? images : undefined,
      sku: product.sku || undefined,
      category: product.category_name || undefined,
      offers: {
        '@type': 'Offer',
        priceCurrency: 'INR',
        price: Number(product.discount_price || product.price).toFixed(2),
        availability: Number(product.stock) > 0 && product.status === 'active'
          ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
        url: `${window.location.origin}/products/${product.id}`,
      },
    },
  });

  if (notFound) {
    return (
      <div>
        <PageHero theme="product" icon={PackageX} title="Product not found" crumbs={[{ label: 'Products', to: '/products' }, { label: 'Not found' }]} compact />
        <div className="py-16 text-center">
          <Link to="/products" className="rounded-full bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white">Browse products</Link>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div>
        <PageHero theme="product" icon={Package} title="Loading..." compact />
        <div className="flex justify-center py-24 text-gray-400"><Loader2 className="animate-spin" size={32} /></div>
      </div>
    );
  }

  const stock = Number(product.stock || 0);
  const inStock = stock > 0 && product.status !== 'out_of_stock';
  const price = Number(product.discount_price || product.price);
  const off = product.discount_price && Number(product.price) > 0
    ? Math.round((1 - Number(product.discount_price) / Number(product.price)) * 100) : 0;

  const handleAdd = () => {
    dispatch(addToCart({ productId: product.id, name: product.name, price, quantity: qty, image: product.images[0]?.image || null }));
    notify.created(`${qty} × ${product.name} added to cart`);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 2000);
  };

  const crumbs = [
    { label: 'Products', to: '/products' },
    ...(product.category_name ? [{ label: product.category_name, to: `/products?categoryId=${product.category_id}` }] : []),
    { label: product.name },
  ];

  return (
    <div>
      <PageHero theme="product" icon={Package} title={product.name} subtitle={product.subcategory_name || product.category_name} crumbs={crumbs} compact />

      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="grid gap-8 rounded-3xl bg-white p-4 shadow-sm ring-1 ring-gray-100 sm:p-6 md:grid-cols-2 lg:gap-12">
          {/* ---- Gallery ---- */}
          <div className="animate-slideInLeft">
            <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-teal-50 to-sky-50">
              {product.images.length ? (
                <img
                  key={active} src={images[active]} alt={product.name}
                  className="aspect-square w-full animate-scaleIn object-cover transition-transform duration-700 group-hover:scale-110"
                />
              ) : (
                <div className="flex aspect-square flex-col items-center justify-center gap-2 text-teal-300"><ImageOff size={48} /> No image</div>
              )}
              {off > 0 && (
                <span className="absolute left-4 top-4 animate-pop rounded-full bg-gradient-to-r from-rose-500 to-orange-500 px-3 py-1 text-sm font-bold text-white shadow-lg">
                  {off}% OFF
                </span>
              )}
            </div>
            {images.length > 1 && (
              <div className="mt-3 grid grid-cols-5 gap-2 sm:gap-3">
                {images.map((src, i) => (
                  <button
                    key={src} onClick={() => setActive(i)} aria-label={`Show image ${i + 1}`}
                    className={`aspect-square animate-scaleIn overflow-hidden rounded-xl border-2 transition-all duration-300 ${
                      i === active ? 'border-teal-500 ring-4 ring-teal-500/20' : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                    style={{ animationDelay: `${i * 60}ms` }}
                  >
                    <img src={src} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ---- Details ---- */}
          <div className="flex flex-col">
            <p className="animate-fadeInUp text-xs font-semibold uppercase tracking-wider text-teal-600">
              {product.category_name}{product.subcategory_name ? ` › ${product.subcategory_name}` : ''}
            </p>
            <h2 className="mt-1 animate-fadeInUp text-2xl font-bold text-gray-900 sm:text-3xl" style={{ animationDelay: '60ms' }}>{product.name}</h2>

            <div className="mt-4 flex animate-fadeInUp flex-wrap items-baseline gap-3" style={{ animationDelay: '120ms' }}>
              <span className="bg-gradient-to-r from-teal-600 to-sky-600 bg-clip-text text-4xl font-extrabold text-transparent">{money(price)}</span>
              {off > 0 && (
                <>
                  <span className="text-lg text-gray-400 line-through">{money(product.price)}</span>
                  <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">Save {money(Number(product.price) - price)}</span>
                </>
              )}
            </div>

            <p className={`mt-3 flex animate-fadeInUp items-center gap-1.5 text-sm font-medium ${inStock ? 'text-emerald-600' : 'text-red-600'}`} style={{ animationDelay: '180ms' }}>
              {inStock ? <PackageCheck size={17} /> : <PackageX size={17} />}
              {inStock ? (stock <= 5 ? `Only ${stock} left - order soon` : 'In stock') : 'Out of stock'}
            </p>

            {product.description && (
              <p className="mt-5 animate-fadeInUp whitespace-pre-line text-sm leading-relaxed text-gray-600" style={{ animationDelay: '240ms' }}>
                {product.description}
              </p>
            )}

            <div className="mt-6 flex animate-fadeInUp flex-col gap-3 sm:flex-row sm:items-center" style={{ animationDelay: '300ms' }}>
              <div className="flex items-center self-start rounded-full border border-gray-300 bg-white">
                <button onClick={() => setQty((q) => Math.max(1, q - 1))} disabled={!inStock || qty <= 1} aria-label="Decrease quantity"
                  className="flex h-11 w-11 items-center justify-center rounded-l-full text-gray-600 hover:bg-gray-50 disabled:opacity-40"><Minus size={16} /></button>
                <span key={qty} className="w-10 animate-pop text-center font-semibold tabular-nums">{qty}</span>
                <button onClick={() => setQty((q) => Math.min(stock, q + 1))} disabled={!inStock || qty >= stock} aria-label="Increase quantity"
                  className="flex h-11 w-11 items-center justify-center rounded-r-full text-gray-600 hover:bg-gray-50 disabled:opacity-40"><Plus size={16} /></button>
              </div>
              <button
                onClick={handleAdd} disabled={!inStock}
                className={`flex flex-1 items-center justify-center gap-2 rounded-full py-3 text-sm font-semibold text-white shadow-lg transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-50 ${
                  justAdded ? 'bg-emerald-500 shadow-emerald-500/30' : 'bg-brand-600'
                }`}
              >
                {justAdded ? <Check size={18} className="animate-pop" /> : <ShoppingCart size={18} />}
                {justAdded ? 'Added!' : inStock ? `Add to cart · ${money(price * qty)}` : 'Out of stock'}
              </button>
            </div>
            {justAdded && (
              <Link to="/cart" className="mt-3 animate-fadeIn text-center text-sm font-medium text-teal-600 hover:underline sm:text-left">Go to cart →</Link>
            )}

            <ul className="mt-8 grid grid-cols-3 gap-2 border-t border-gray-100 pt-6 text-center text-xs text-gray-500">
              {[[Truck, 'Fast delivery'], [ShieldCheck, 'Secure payment'], [RotateCcw, 'Easy returns']].map(([I, t], i) => (
                <li key={t} className="flex animate-fadeInUp flex-col items-center gap-1.5" style={{ animationDelay: `${360 + i * 60}ms` }}>
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-teal-50 to-sky-100 text-teal-600"><I size={18} /></span>
                  {t}
                </li>
              ))}
            </ul>
            {product.sku && <p className="mt-4 text-xs text-gray-400">SKU: {product.sku}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
