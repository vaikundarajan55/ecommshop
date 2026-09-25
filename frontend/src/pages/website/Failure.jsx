import { Link, useLocation } from 'react-router-dom';
import { XCircle, RefreshCw, ShoppingCart, AlertTriangle, Headphones } from 'lucide-react';
import useSeo from '../../hooks/useSeo';
import PageHero from '../../components/website/common/PageHero';

export default function Failure() {
  useSeo({ title: 'Payment failed', noindex: true });
  const { state } = useLocation();

  return (
    <div>
      <PageHero theme="failure" icon={AlertTriangle} title="Payment failed" subtitle="Don't worry - your cart is still saved" crumbs={[{ label: 'Payment failed' }]} />

      <div className="mx-auto max-w-xl px-4 py-10">
        <div className="animate-scaleIn rounded-3xl bg-white p-8 text-center shadow-xl ring-1 ring-gray-100">
          <span className="relative mx-auto flex h-24 w-24 items-center justify-center">
            <span className="absolute inset-0 animate-ping rounded-full bg-rose-200/60 [animation-iteration-count:2]" />
            <span className="relative flex h-24 w-24 animate-pop items-center justify-center rounded-full bg-gradient-to-br from-rose-500 to-red-600 text-white shadow-xl shadow-rose-500/30">
              <XCircle size={48} className="animate-shake" />
            </span>
          </span>
          <h2 className="mt-6 animate-fadeInUp text-2xl font-bold text-gray-900" style={{ animationDelay: '200ms' }}>We couldn&apos;t place your order</h2>
          <p className="mt-2 animate-fadeInUp text-sm text-gray-500" style={{ animationDelay: '280ms' }}>
            {state?.message || 'Something went wrong while processing your order. Please try again in a moment.'}
          </p>

          <ul className="mt-6 animate-fadeInUp space-y-2 rounded-2xl bg-gradient-to-br from-rose-50 to-orange-50 p-4 text-left text-sm text-gray-600" style={{ animationDelay: '360ms' }}>
            <li>• Check your connection and try again</li>
            <li>• Try a different payment method</li>
            <li>• Make sure items in your cart are still in stock</li>
          </ul>

          <div className="mt-7 flex animate-fadeInUp flex-col gap-3 sm:flex-row sm:justify-center" style={{ animationDelay: '440ms' }}>
            <Link to="/payment" className="inline-flex items-center justify-center gap-2 rounded-full bg-brand-600 px-6 py-3 text-sm font-semibold text-white">
              <RefreshCw size={16} /> Try again
            </Link>
            <Link to="/cart" className="inline-flex items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50">
              <ShoppingCart size={16} /> Back to cart
            </Link>
          </div>
          <p className="mt-6 flex items-center justify-center gap-1.5 text-xs text-gray-400"><Headphones size={13} /> Still stuck? Contact support with the time of your attempt.</p>
        </div>
      </div>
    </div>
  );
}
