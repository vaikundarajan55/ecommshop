import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ImageOff, ShoppingCart, Eye } from 'lucide-react';
import { imageUrl } from '../../../utils/imageUrl';
import QuickViewModal from './QuickViewModal';

const money = (v) => `₹${Number(v || 0).toLocaleString('en-IN')}`;

export default function ProductCard({ product, index = 0 }) {
  const [quickOpen, setQuickOpen] = useState(false);
  const off = product.discount_price && Number(product.price) > 0
    ? Math.round((1 - Number(product.discount_price) / Number(product.price)) * 100) : 0;
  const soldOut = product.status === 'out_of_stock' || Number(product.stock) <= 0;

  const openQuick = (e) => {
    e.preventDefault(); // the card itself is a link - don't navigate
    e.stopPropagation();
    setQuickOpen(true);
  };

  return (
    <>
      <Link
        to={`/products/${product.id}`}
        className="group relative block animate-fadeInUp overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-brand-100 hover:shadow-xl hover:shadow-brand-500/10"
        style={{ animationDelay: `${index * 70}ms` }}
      >
        <div className="relative aspect-square overflow-hidden bg-gray-100">
          {product.primary_image ? (
            <img
              src={imageUrl(product.primary_image)} alt={product.name} loading="lazy"
              className="h-full w-full animate-fadeIn object-cover transition-transform duration-700 ease-out group-hover:scale-110"
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-1 text-sm text-gray-400">
              <ImageOff size={26} /> No image
            </div>
          )}

          {/* dark fade + "Quick view" on hover */}
          <div className="absolute inset-0 flex items-end justify-center bg-gradient-to-t from-black/40 via-transparent to-transparent pb-3 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            <button
              type="button" onClick={openQuick}
              className="flex translate-y-3 items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-xs font-semibold text-gray-800 shadow transition-all duration-300 hover:bg-white group-hover:translate-y-0"
            >
              <Eye size={14} /> Quick view
            </button>
          </div>

          {off > 0 && (
            <span className="absolute left-2 top-2 rounded-full bg-gradient-to-r from-rose-500 to-orange-500 px-2 py-0.5 text-[11px] font-bold text-white shadow">
              {off}% OFF
            </span>
          )}
          {soldOut && (
            <span className="absolute right-2 top-2 rounded-full bg-gray-900/80 px-2 py-0.5 text-[11px] font-semibold text-white">Sold out</span>
          )}
        </div>

        <div className="p-3">
          {product.category_name && <p className="truncate text-[11px] uppercase tracking-wide text-gray-400">{product.category_name}</p>}
          <h3 className="truncate text-sm font-medium text-gray-800 transition-colors group-hover:text-brand-600">{product.name}</h3>
          <div className="mt-2 flex items-center justify-between gap-2">
            <p className="text-sm font-bold text-gray-900">
              {money(product.discount_price || product.price)}
              {off > 0 && <span className="ml-1.5 text-xs font-normal text-gray-400 line-through">{money(product.price)}</span>}
            </p>
            <button
              type="button" onClick={openQuick} aria-label={`Add ${product.name} to cart`} title="Add to cart"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-600 text-white shadow-md shadow-brand-500/30 transition-transform duration-300 hover:rotate-12 hover:scale-110"
            >
              <ShoppingCart size={16} />
            </button>
          </div>
        </div>
      </Link>

      <QuickViewModal productId={product.id} open={quickOpen} onClose={() => setQuickOpen(false)} />
    </>
  );
}
