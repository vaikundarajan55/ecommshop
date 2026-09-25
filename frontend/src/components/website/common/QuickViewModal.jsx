import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Check, ImageOff, Minus, Plus, ShoppingCart, Loader2, PackageCheck, PackageX } from 'lucide-react';
import { addToCart } from '../../../store/slices/website/cartSlice';
import { fetchProductById } from '../../../store/slices/website/catalogSlice';
import { notify } from '../../../utils/notify';
import { imageUrl } from '../../../utils/imageUrl';
import Modal from '../../admin/common/Modal';

const money = (v) => `₹${Number(v || 0).toLocaleString('en-IN')}`;

// Product quick view: full details + image gallery + quantity, opened from a product card's cart button
export default function QuickViewModal({ productId, open, onClose }) {
  const dispatch = useDispatch();
  const [loaded, setLoaded] = useState(false);
  const cached = useSelector((s) => s.catalog.details[productId]);
  const product = loaded ? cached : null; // always show fresh price / stock
  const [active, setActive] = useState(0);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (!open || !productId) return;
    setLoaded(false); setActive(0); setQty(1); setAdded(false);
    dispatch(fetchProductById(productId)).unwrap()
      .then(() => setLoaded(true))
      .catch((err) => { notify.error(err); onClose(); });
  }, [open, productId]); // eslint-disable-line react-hooks/exhaustive-deps

  const stock = Number(product?.stock || 0);
  const inStock = product && stock > 0 && product.status !== 'out_of_stock';
  const price = product ? Number(product.discount_price || product.price) : 0;
  const off = product?.discount_price && Number(product.price) > 0
    ? Math.round((1 - Number(product.discount_price) / Number(product.price)) * 100) : 0;

  const handleAdd = () => {
    dispatch(addToCart({
      productId: product.id, name: product.name, price,
      image: product.images[0]?.image || null, quantity: qty,
    }));
    notify.created(`${qty} × ${product.name} added to cart`);
    setAdded(true);
  };

  // staggered entrance for the detail blocks
  const reveal = (i) => ({ style: { animationDelay: `${120 + i * 70}ms` } });

  return (
    <Modal open={open} onClose={onClose} size="max-w-4xl" title="Quick view">
      {!product ? (
        <div className="flex h-72 items-center justify-center text-gray-400">
          <Loader2 className="animate-spin" size={28} />
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {/* ---- Gallery ---- */}
          <div className="animate-slideInLeft">
            <div className="relative overflow-hidden rounded-xl bg-gray-100">
              {product.images.length ? (
                <img
                  key={active}
                  src={imageUrl(product.images[active].image)} alt={product.name}
                  className="aspect-square w-full animate-scaleIn object-cover transition-transform duration-500 hover:scale-110"
                />
              ) : (
                <div className="flex aspect-square flex-col items-center justify-center gap-2 text-gray-400">
                  <ImageOff size={36} /> No image
                </div>
              )}
              {off > 0 && (
                <span className="absolute left-3 top-3 animate-pop rounded-full bg-gradient-to-r from-rose-500 to-orange-500 px-2.5 py-1 text-xs font-bold text-white shadow-lg">
                  {off}% OFF
                </span>
              )}
            </div>
            {product.images.length > 1 && (
              <div className="mt-3 grid grid-cols-5 gap-2">
                {product.images.map((img, i) => (
                  <button
                    key={img.id} type="button" onClick={() => setActive(i)}
                    className={`aspect-square animate-scaleIn overflow-hidden rounded-lg border-2 transition-all duration-200 ${
                      i === active ? 'border-brand-500 ring-2 ring-brand-500/25' : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                    style={{ animationDelay: `${200 + i * 50}ms` }}
                  >
                    <img src={imageUrl(img.image)} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ---- Details ---- */}
          <div className="flex flex-col">
            <p {...reveal(0)} className="animate-fadeInUp">
              <span className="text-xs font-medium uppercase tracking-wide text-brand-600">
                {product.category_name}{product.subcategory_name ? ` › ${product.subcategory_name}` : ''}
              </span>
            </p>
            <h2 {...reveal(1)} className="mt-1 animate-fadeInUp text-2xl font-bold text-gray-800">{product.name}</h2>

            <div {...reveal(2)} className="mt-3 flex animate-fadeInUp flex-wrap items-baseline gap-2">
              <span className="text-3xl font-bold text-gray-900">{money(price)}</span>
              {off > 0 && (
                <>
                  <span className="text-base text-gray-400 line-through">{money(product.price)}</span>
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                    You save {money(Number(product.price) - price)}
                  </span>
                </>
              )}
            </div>

            <p {...reveal(3)} className={`mt-3 flex animate-fadeInUp items-center gap-1.5 text-sm font-medium ${inStock ? 'text-emerald-600' : 'text-red-600'}`}>
              {inStock ? <PackageCheck size={16} /> : <PackageX size={16} />}
              {inStock ? (stock <= 5 ? `Only ${stock} left - order soon` : `In stock (${stock} available)`) : 'Out of stock'}
            </p>

            {product.description && (
              <p {...reveal(4)} className="mt-4 max-h-40 animate-fadeInUp overflow-y-auto whitespace-pre-line text-sm leading-relaxed text-gray-600">
                {product.description}
              </p>
            )}
            {product.sku && <p {...reveal(5)} className="mt-3 animate-fadeInUp text-xs text-gray-400">SKU: {product.sku}</p>}

            <div {...reveal(6)} className="mt-auto animate-fadeInUp pt-6">
              {added ? (
                <div className="animate-scaleIn rounded-xl bg-emerald-50 p-4 text-center ring-1 ring-emerald-200">
                  <span className="mx-auto flex h-12 w-12 animate-pop items-center justify-center rounded-full bg-emerald-500 text-white">
                    <Check size={26} strokeWidth={3} />
                  </span>
                  <p className="mt-2 font-semibold text-emerald-800">Added to your cart!</p>
                  <div className="mt-3 flex gap-2">
                    <button onClick={onClose} className="flex-1 rounded-lg border border-gray-300 bg-white py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                      Continue shopping
                    </button>
                    <Link to="/cart" onClick={onClose} className="flex-1 rounded-lg bg-brand-600 py-2 text-center text-sm font-semibold text-white">
                      View cart
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="flex items-center rounded-lg border border-gray-300">
                    <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} disabled={!inStock || qty <= 1}
                      className="flex h-10 w-10 items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-40" aria-label="Decrease quantity">
                      <Minus size={16} />
                    </button>
                    <span key={qty} className="w-10 animate-pop text-center font-semibold tabular-nums">{qty}</span>
                    <button type="button" onClick={() => setQty((q) => Math.min(stock, q + 1))} disabled={!inStock || qty >= stock}
                      className="flex h-10 w-10 items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-40" aria-label="Increase quantity">
                      <Plus size={16} />
                    </button>
                  </div>
                  <button
                    onClick={handleAdd} disabled={!inStock}
                    className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-brand-600 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <ShoppingCart size={17} /> {inStock ? `Add to cart · ${money(price * qty)}` : 'Out of stock'}
                  </button>
                </div>
              )}
              <Link to={`/products/${product.id}`} onClick={onClose} className="mt-3 block text-center text-sm font-medium text-brand-600 hover:underline">
                View full details →
              </Link>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
