import { useLocation, Link, Navigate } from 'react-router-dom';
import { CheckCircle2, PartyPopper, Truck, ShoppingBag, BadgeCheck, ArrowRight } from 'lucide-react';
import useSeo from '../../hooks/useSeo';
import PageHero from '../../components/website/common/PageHero';
import CheckoutSteps from '../../components/website/common/CheckoutSteps';

const COLORS = ['#22c55e', '#14b8a6', '#f59e0b', '#ec4899', '#6366f1', '#f97316'];
// Fixed confetti layout so it doesn't change between renders
const CONFETTI = Array.from({ length: 40 }, (_, i) => ({
  left: `${(i * 37) % 100}%`,
  delay: `${((i * 13) % 20) / 10}s`,
  duration: `${2.5 + ((i * 7) % 20) / 10}s`,
  color: COLORS[i % COLORS.length],
  size: 6 + (i % 4) * 2,
  round: i % 3 === 0,
}));

const METHOD_LABELS = { cod: 'Cash on Delivery', upi: 'UPI', card: 'Card', netbanking: 'Net banking', wallet: 'Wallet' };

export default function Success() {
  useSeo({ title: 'Order placed', noindex: true });
  const { state } = useLocation();

  // Reached without placing an order (refresh / typed URL)
  if (!state?.orderNo) return <Navigate to="/dashboard" replace />;
  const paid = Boolean(state.paymentId); // online payment went through

  return (
    <div className="relative overflow-hidden">
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
        {CONFETTI.map((c, i) => (
          <span
            key={i}
            className={`absolute -top-5 animate-confetti ${c.round ? 'rounded-full' : 'rounded-sm'}`}
            style={{ left: c.left, width: c.size, height: c.size * (c.round ? 1 : 1.6), background: c.color, animationDelay: c.delay, animationDuration: c.duration }}
          />
        ))}
      </div>

      <PageHero theme="success" icon={PartyPopper} title={paid ? 'Payment successful!' : 'Order placed!'} subtitle="Thank you for shopping with ShopEase">
        <div className="max-w-xl"><CheckoutSteps current={4} /></div>
      </PageHero>

      <div className="mx-auto max-w-xl px-4 py-10">
        <div className="animate-scaleIn rounded-3xl bg-white p-8 text-center shadow-xl ring-1 ring-gray-100">
          <span className="relative mx-auto flex h-24 w-24 items-center justify-center">
            <span className="absolute inset-0 animate-ping rounded-full bg-emerald-200/70" />
            <span className="relative flex h-24 w-24 animate-pop items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-teal-500 text-white shadow-xl shadow-emerald-500/30">
              <CheckCircle2 size={48} />
            </span>
          </span>
          <h2 className="mt-6 animate-fadeInUp text-2xl font-bold text-gray-900" style={{ animationDelay: '200ms' }}>
            {paid ? 'Payment successful!' : 'Your order is confirmed'}
          </h2>
          <p className="mt-2 animate-fadeInUp text-sm text-gray-500" style={{ animationDelay: '280ms' }}>
            {paid
              ? 'Thank you! Your payment was received and your order is confirmed. We will start preparing it right away.'
              : 'We’ve received your order and will start preparing it right away. You can follow it live from My Orders.'}
          </p>

          {paid && (
            <p role="status" className="mx-auto mt-4 flex w-fit animate-fadeInUp items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 ring-1 ring-emerald-200" style={{ animationDelay: '320ms' }}>
              <BadgeCheck size={18} />
              ₹{Number(state.total).toLocaleString('en-IN', { minimumFractionDigits: 2 })} paid via {METHOD_LABELS[state.method] || state.method}
            </p>
          )}

          <dl className="mt-6 grid animate-fadeInUp grid-cols-1 gap-3 rounded-2xl bg-gradient-to-br from-green-50 to-teal-50 p-4 text-sm sm:grid-cols-3" style={{ animationDelay: '360ms' }}>
            <div><dt className="text-xs text-gray-500">Order no</dt><dd className="font-semibold text-gray-900">{state.orderNo}</dd></div>
            {state.total != null && <div><dt className="text-xs text-gray-500">Amount</dt><dd className="font-semibold text-gray-900">₹{Number(state.total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</dd></div>}
            {state.method && <div><dt className="text-xs text-gray-500">Payment</dt><dd className="font-semibold text-gray-900">{METHOD_LABELS[state.method] || state.method}</dd></div>}
            {state.paymentId && <div className="sm:col-span-3"><dt className="text-xs text-gray-500">Payment ID</dt><dd className="break-all font-mono text-xs font-semibold text-gray-900">{state.paymentId}</dd></div>}
          </dl>

          <div className="mt-7 flex animate-fadeInUp flex-col gap-3 sm:flex-row sm:justify-center" style={{ animationDelay: '440ms' }}>
            <Link to="/products" replace className="group inline-flex items-center justify-center gap-2 rounded-full bg-brand-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-600/25 transition-transform hover:-translate-y-0.5">
              <ShoppingBag size={16} /> Continue shopping <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
            </Link>
            <Link to="/my-orders" className="inline-flex items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50">
              <Truck size={16} /> Track order
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
