import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Navigate, useNavigate, Link } from 'react-router-dom';
import { CreditCard, Check, MapPin, Loader2, Lock, AlertTriangle, FlaskConical, Copy } from 'lucide-react';
import { notify, errorMessage } from '../../utils/notify';
import { clearCart } from '../../store/slices/website/cartSlice';
import {
  fetchPaymentConfig, fetchPaymentMethods, placeOrder, createRazorpayOrder, verifyRazorpayPayment, reportPaymentFailure,
} from '../../store/slices/website/checkoutSlice';
import useSeo from '../../hooks/useSeo';
import PageHero from '../../components/website/common/PageHero';
import CheckoutSteps from '../../components/website/common/CheckoutSteps';
import OrderSummary from '../../components/website/common/OrderSummary';
import { methodStyle } from '../../utils/paymentMethodStyle';
import { loadRazorpay, TEST_DETAILS } from '../../utils/razorpay';
import DemoGatewayModal from '../../components/website/common/DemoGatewayModal';

export default function Payment() {
  useSeo({ title: 'Payment', noindex: true });
  const items = useSelector((s) => s.cart.items);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { methods, gateway } = useSelector((s) => s.checkout); // methods: null = loading; gateway: { razorpay, demo, keyId, testMode }
  const [method, setMethod] = useState('');
  const [loading, setLoading] = useState(false);
  const [demo, setDemo] = useState(null); // open demo gateway popup: { rzp, method, allowed, onSuccess, onDismiss }

  useEffect(() => { dispatch(fetchPaymentConfig()); }, [dispatch]);

  useEffect(() => {
    dispatch(fetchPaymentMethods()).unwrap()
      .then((list) => {
        const preferred = list.find((m) => m.is_default) || list[0];
        if (preferred) setMethod(preferred.code);
      })
      .catch((err) => notify.error(err));
  }, [dispatch]);
  const total = items.reduce((a, i) => a + i.price * i.quantity, 0);
  const address = (() => { try { return JSON.parse(sessionStorage.getItem('checkout_address') || 'null'); } catch { return null; } })();

  if (!items.length && !loading) return <Navigate to="/cart" replace />;
  if (!address) return <Navigate to="/checkout" replace />;

  const online = method !== 'cod' && gateway?.razorpay;

  const finish = (result) => {
    notify.success(result.paymentId ? 'Payment successful! Your order is confirmed.' : 'Order placed successfully!');
    navigate('/order-success', { replace: true, state: result });
    dispatch(clearCart());
    sessionStorage.removeItem('checkout_address');
  };
  const fail = (message) => {
    notify.error(message || 'Payment failed');
    navigate('/order-failure', { state: { message } });
  };

  // Cash on Delivery: the order is placed straight away
  const placeCodOrder = async () => {
    const order = await dispatch(placeOrder({ items, shippingAddress: address, paymentMethod: method })).unwrap();
    finish({ orderNo: order.orderNo, orderId: order.orderId, total: order.totalAmount ?? total, method });
  };

  // UPI / card / net banking / wallet: Razorpay Checkout popup (or the demo gateway);
  // the order is created once the payment is verified
  const payOnline = async () => {
    const Razorpay = gateway.demo ? null : await loadRazorpay();
    const rzp = await dispatch(createRazorpayOrder({ items, paymentMethod: method })).unwrap();

    await new Promise((resolve) => {
      const onPaid = async (response) => {
        try {
          const o = await dispatch(verifyRazorpayPayment({ ...response, shippingAddress: address })).unwrap();
          finish({ orderNo: o.orderNo, orderId: o.orderId, total: o.total, method: o.method, paymentId: o.paymentId });
        } catch (err) {
          fail(err);
        }
        resolve();
      };
      // Closed without paying - stay on this page so they can try again
      const onDismiss = () => { notify.error('Payment cancelled'); resolve(); };

      if (gateway.demo) {
        const allowed = (methods || []).map((m) => m.code).filter((c) => c !== 'cod');
        setDemo({ rzp, method, allowed, onSuccess: (r) => { setDemo(null); onPaid(r); }, onDismiss: () => { setDemo(null); onDismiss(); } });
        return;
      }

      const checkout = new Razorpay({
        key: rzp.keyId,
        order_id: rzp.razorpayOrderId,
        amount: rzp.amount,
        currency: rzp.currency,
        name: rzp.shopName,
        description: `${items.length} item${items.length === 1 ? '' : 's'}`,
        prefill: { name: rzp.customer.name, email: rzp.customer.email, contact: address.phone, method },
        theme: { color: '#4f46e5' },
        handler: onPaid,
        modal: { ondismiss: onDismiss },
      });
      // A failed attempt keeps the popup open for a retry - just record it
      checkout.on('payment.failed', (resp) => {
        dispatch(reportPaymentFailure({ razorpay_order_id: rzp.razorpayOrderId, error: resp.error }));
      });
      checkout.open();
    });
  };

  const handlePay = async () => {
    setLoading(true);
    try {
      if (online) await payOnline();
      else await placeCodOrder();
    } catch (err) {
      fail(errorMessage(err, err?.message)); // thunk message, or e.g. Razorpay script failed to load
    } finally {
      setLoading(false);
    }
  };

  const copy = (text) => navigator.clipboard?.writeText(text.replace(/ /g, '')).then(() => notify.success('Copied'));

  return (
    <div>
      <PageHero theme="payment" icon={CreditCard} title="Payment" subtitle="Choose how you'd like to pay" crumbs={[{ label: 'Cart', to: '/cart' }, { label: 'Checkout', to: '/checkout' }, { label: 'Payment' }]}>
        <div className="max-w-xl"><CheckoutSteps current={2} /></div>
      </PageHero>

      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="grid items-start gap-6 lg:grid-cols-3">
          <div className="space-y-5 lg:col-span-2">
            {/* Delivery address recap */}
            <div className="flex animate-fadeInUp items-start gap-3 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-sky-500 text-white"><MapPin size={18} /></span>
              <div className="min-w-0 flex-1 text-sm">
                <p className="font-semibold text-gray-900">Delivering to</p>
                <p className="text-gray-600">{address.line1}, {address.city}, {address.state} - {address.pincode}</p>
                <p className="text-gray-500">Phone: {address.phone}</p>
              </div>
              <Link to="/checkout" className="text-sm font-medium text-indigo-600 hover:underline">Change</Link>
            </div>

            {/* Methods */}
            <fieldset className="animate-fadeInUp rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100" style={{ animationDelay: '100ms' }}>
              <legend className="sr-only">Payment method</legend>
              <p className="mb-4 font-semibold text-gray-900">Payment method</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {methods === null && [0, 1, 2, 3].map((i) => (
                  <div key={i} className="h-[76px] animate-shimmer rounded-xl bg-gradient-to-r from-gray-100 via-white to-gray-100 bg-[length:200%_100%]" />
                ))}
                {methods?.length === 0 && (
                  <p className="flex items-center gap-2 text-sm text-amber-700 sm:col-span-2"><AlertTriangle size={16} /> No payment methods are available right now.</p>
                )}
                {methods?.map(({ code: id, name: label, description: text, is_default: isDefault }, i) => {
                  const { icon: Icon, color } = methodStyle(id);
                  const selected = method === id;
                  return (
                    <label
                      key={id}
                      className={`relative flex cursor-pointer animate-scaleIn items-center gap-3 rounded-xl border-2 p-4 transition-all duration-300 ${
                        selected ? 'border-indigo-500 bg-indigo-50/60 shadow-md shadow-indigo-500/10' : 'border-gray-200 hover:-translate-y-0.5 hover:border-indigo-200'
                      }`}
                      style={{ animationDelay: `${150 + i * 70}ms` }}
                    >
                      <input type="radio" name="method" value={id} checked={selected} onChange={() => setMethod(id)} className="sr-only" />
                      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${color} text-white shadow transition-transform duration-300 ${selected ? 'scale-110' : ''}`}>
                        <Icon size={20} />
                      </span>
                      <span className="min-w-0">
                        <span className="flex items-center gap-1.5 text-sm font-semibold text-gray-900">
                          {label}
                          {isDefault ? <span className="rounded-full bg-indigo-100 px-1.5 py-px text-[10px] font-semibold text-indigo-700">Recommended</span> : null}
                        </span>
                        <span className="block text-xs text-gray-500">{text}</span>
                      </span>
                      <span className={`absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full transition-all duration-300 ${selected ? 'scale-100 bg-indigo-600 text-white' : 'scale-0'}`}>
                        <Check size={12} strokeWidth={3} />
                      </span>
                    </label>
                  );
                })}
              </div>
            </fieldset>

            {online && gateway.demo && (
              <div className="flex animate-fadeInUp items-start gap-3 rounded-2xl border border-dashed border-amber-300 bg-amber-50/70 p-5 text-sm">
                <FlaskConical size={18} className="mt-0.5 shrink-0 text-amber-700" />
                <div>
                  <p className="font-semibold text-amber-800">Demo payment gateway - no real money is charged</p>
                  <p className="mt-1 text-xs text-amber-700">Click Pay to open the demo popup. Pay places a paid order; &ldquo;Simulate a failed payment&rdquo; shows a declined payment.</p>
                </div>
              </div>
            )}

            {/* Razorpay test mode: sample details to complete a payment without real money */}
            {online && gateway.testMode && !gateway.demo && (
              <div className="animate-fadeInUp rounded-2xl border border-dashed border-amber-300 bg-amber-50/70 p-5">
                <p className="flex items-center gap-2 font-semibold text-amber-800"><FlaskConical size={18} /> Test mode - no real money is charged</p>
                <p className="mt-1 text-xs text-amber-700">Use these sample details in the Razorpay popup:</p>
                <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                  {TEST_DETAILS.map((t) => (
                    <li key={t.label} className="rounded-xl bg-white p-3 text-sm ring-1 ring-amber-100">
                      <p className="text-xs font-medium text-gray-500">{t.label}</p>
                      <button type="button" onClick={() => copy(t.value)} className="flex items-center gap-1.5 font-mono font-semibold text-gray-900 hover:text-indigo-600">
                        {t.value} <Copy size={12} className="text-gray-400" />
                      </button>
                      <p className="text-xs text-gray-400">{t.hint}</p>
                    </li>
                  ))}
                </ul>
                <a href="https://razorpay.com/docs/payments/payments/test-card-details/" target="_blank" rel="noreferrer" className="mt-3 inline-block text-xs font-medium text-amber-800 underline">
                  More Razorpay test cards
                </a>
              </div>
            )}
          </div>

          <OrderSummary items={items} showItems accent="from-indigo-600 via-blue-600 to-sky-500">
            <button
              disabled={loading || !method || !gateway} onClick={handlePay}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-brand-600 py-3 text-sm font-semibold text-white disabled:opacity-70"
            >
              {loading ? <Loader2 size={17} className="animate-spin" /> : <Lock size={16} />}
              {loading
                ? (online ? 'Waiting for payment...' : 'Placing order...')
                : online ? `Pay ₹${total.toLocaleString('en-IN')} securely` : method === 'cod' ? 'Place order' : 'Pay & place order'}
            </button>
            <p className="mt-3 flex items-center justify-center gap-1 text-xs text-gray-400"><Lock size={12} /> {online && !gateway.demo ? 'Secured by Razorpay' : 'Secure checkout'}</p>
          </OrderSummary>
        </div>
      </div>

      {demo && <DemoGatewayModal session={demo} onSuccess={demo.onSuccess} onDismiss={demo.onDismiss} />}
    </div>
  );
}
