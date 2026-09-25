import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { X, Lock, Loader2, CheckCircle2, AlertTriangle, FlaskConical } from 'lucide-react';
import { payDemo } from '../../../store/slices/website/checkoutSlice';
import { methodStyle } from '../../../utils/paymentMethodStyle';

// Built-in fake payment gateway (backend PAYMENT_DEMO_MODE=true, no Razorpay keys).
// Goes through the same server steps as Razorpay: the order is only placed after /verify.
const TABS = [
  ['upi', 'UPI'],
  ['card', 'Card'],
  ['netbanking', 'Net banking'],
  ['wallet', 'Wallet'],
];
const BANKS = ['State Bank of India', 'HDFC Bank', 'ICICI Bank', 'Axis Bank', 'Kotak Mahindra Bank'];
const WALLETS = ['Paytm', 'PhonePe', 'Amazon Pay', 'Mobikwik'];

const input = 'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500';

export default function DemoGatewayModal({ session, onSuccess, onDismiss }) {
  const { rzp, method: initialMethod, allowed } = session;
  const dispatch = useDispatch();
  const tabs = TABS.filter(([id]) => allowed.includes(id));
  const [method, setMethod] = useState(allowed.includes(initialMethod) ? initialMethod : tabs[0]?.[0]);
  const [form, setForm] = useState({
    upi: 'success@demo', card: '4111 1111 1111 1111', expiry: '12/30', cvv: '123', name: rzp.customer.name,
    bank: BANKS[0], wallet: WALLETS[0],
  });
  const [stage, setStage] = useState('form'); // form | processing | done
  const [error, setError] = useState('');

  // Esc closes like a real checkout popup (but not mid-payment)
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape' && stage === 'form') onDismiss(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [stage, onDismiss]);

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });
  const amount = (rzp.amount / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 });

  const pay = async (outcome) => {
    setError('');
    setStage('processing');
    await new Promise((r) => setTimeout(r, 1200)); // feels like a bank round trip
    try {
      const result = await dispatch(payDemo({ razorpay_order_id: rzp.razorpayOrderId, method, outcome })).unwrap();
      setStage('done');
      await new Promise((r) => setTimeout(r, 700));
      onSuccess(result); // same shape as Razorpay's success handler response
    } catch (err) {
      setStage('form');
      setError(err);
    }
  };

  const { icon: Icon, color } = methodStyle(method);

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label="Demo payment">
      <div className="w-full max-w-md animate-scaleIn overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl">
        {/* Header */}
        <div className="relative bg-gradient-to-br from-indigo-600 via-blue-600 to-sky-500 px-5 pb-5 pt-4 text-white">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide"><FlaskConical size={12} /> Demo gateway</span>
            {stage === 'form' && (
              <button onClick={onDismiss} aria-label="Close" className="rounded-full p-1 transition-colors hover:bg-white/20"><X size={18} /></button>
            )}
          </div>
          <p className="mt-3 text-sm text-white/80">{rzp.shopName}</p>
          <p className="text-3xl font-bold">₹{amount}</p>
          <p className="mt-1 text-xs text-white/70">{rzp.customer.email}</p>
        </div>

        {stage === 'processing' && (
          <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
            <Loader2 size={40} className="animate-spin text-indigo-600" />
            <p className="font-semibold text-gray-900">Processing payment…</p>
            <p className="text-sm text-gray-500">Please don&apos;t close this window</p>
          </div>
        )}

        {stage === 'done' && (
          <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
            <CheckCircle2 size={48} className="animate-pop text-emerald-500" />
            <p className="font-semibold text-gray-900">Payment of ₹{amount} successful</p>
            <p className="text-sm text-gray-500">Placing your order…</p>
          </div>
        )}

        {stage === 'form' && (
          <div className="p-5">
            {/* Method tabs */}
            <div className="grid gap-1 rounded-xl bg-gray-100 p-1" style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}>
              {tabs.map(([id, label]) => (
                <button
                  key={id} type="button" onClick={() => { setMethod(id); setError(''); }}
                  className={`rounded-lg px-1 py-1.5 text-xs font-semibold transition-all ${method === id ? 'bg-white text-indigo-700 shadow' : 'text-gray-500 hover:text-gray-800'}`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div key={method} className="mt-4 animate-fadeInUp space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                <span className={`flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br ${color} text-white`}><Icon size={16} /></span>
                {TABS.find(([id]) => id === method)?.[1]}
              </div>

              {method === 'upi' && (
                <label className="block text-xs font-medium text-gray-600">UPI ID
                  <input className={`${input} mt-1 font-mono`} value={form.upi} onChange={set('upi')} />
                </label>
              )}
              {method === 'card' && (
                <>
                  <label className="block text-xs font-medium text-gray-600">Card number
                    <input className={`${input} mt-1 font-mono`} value={form.card} onChange={set('card')} inputMode="numeric" />
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="block text-xs font-medium text-gray-600">Expiry
                      <input className={`${input} mt-1 font-mono`} value={form.expiry} onChange={set('expiry')} />
                    </label>
                    <label className="block text-xs font-medium text-gray-600">CVV
                      <input className={`${input} mt-1 font-mono`} value={form.cvv} onChange={set('cvv')} type="password" inputMode="numeric" />
                    </label>
                  </div>
                  <label className="block text-xs font-medium text-gray-600">Name on card
                    <input className={`${input} mt-1`} value={form.name} onChange={set('name')} />
                  </label>
                </>
              )}
              {method === 'netbanking' && (
                <label className="block text-xs font-medium text-gray-600">Bank
                  <select className={`${input} mt-1`} value={form.bank} onChange={set('bank')}>
                    {BANKS.map((b) => <option key={b}>{b}</option>)}
                  </select>
                </label>
              )}
              {method === 'wallet' && (
                <label className="block text-xs font-medium text-gray-600">Wallet
                  <select className={`${input} mt-1`} value={form.wallet} onChange={set('wallet')}>
                    {WALLETS.map((w) => <option key={w}>{w}</option>)}
                  </select>
                </label>
              )}
              <p className="text-[11px] text-gray-400">Demo only - these details are not sent anywhere and no money is charged.</p>
            </div>

            {error && (
              <p className="mt-4 flex animate-shake items-start gap-2 rounded-lg bg-rose-50 p-3 text-sm text-rose-700"><AlertTriangle size={16} className="mt-0.5 shrink-0" /> {error}</p>
            )}

            <button onClick={() => pay('success')} className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-indigo-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-indigo-700">
              <Lock size={15} /> Pay ₹{amount}
            </button>
            <button onClick={() => pay('failure')} className="mt-2 w-full rounded-full py-2 text-xs font-medium text-rose-600 transition-colors hover:bg-rose-50">
              Simulate a failed payment
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
