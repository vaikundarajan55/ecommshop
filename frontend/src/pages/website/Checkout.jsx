import { useState } from 'react';
import { useSelector } from 'react-redux';
import { Navigate, useNavigate, Link } from 'react-router-dom';
import { MapPin, Home, Building2, Map, Hash, Phone, ArrowRight } from 'lucide-react';
import useSeo from '../../hooks/useSeo';
import PageHero from '../../components/website/common/PageHero';
import CheckoutSteps from '../../components/website/common/CheckoutSteps';
import OrderSummary from '../../components/website/common/OrderSummary';
import AuthInput from '../../components/common/auth/AuthInput';

const readSaved = () => {
  try { return JSON.parse(sessionStorage.getItem('checkout_address') || 'null'); } catch { return null; }
};

export default function Checkout() {
  useSeo({ title: 'Checkout', noindex: true });
  const items = useSelector((s) => s.cart.items);
  const user = useSelector((s) => s.auth.user);
  const navigate = useNavigate();
  const [address, setAddress] = useState(
    () => readSaved() || { line1: '', city: '', state: '', pincode: '', phone: user?.phone || '' }
  );

  if (!items.length) return <Navigate to="/cart" replace />;

  const set = (key) => (e) => setAddress({ ...address, [key]: e.target.value });

  const handleContinue = (e) => {
    e.preventDefault();
    // Stash address in sessionStorage for the payment step (demo-simple; swap for server-side session/order draft in production)
    sessionStorage.setItem('checkout_address', JSON.stringify(address));
    navigate('/payment');
  };

  return (
    <div>
      <PageHero theme="checkout" icon={MapPin} title="Delivery address" subtitle="Where should we send your order?" crumbs={[{ label: 'Cart', to: '/cart' }, { label: 'Checkout' }]}>
        <div className="max-w-xl"><CheckoutSteps current={1} /></div>
      </PageHero>

      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="grid items-start gap-6 lg:grid-cols-3">
          <form onSubmit={handleContinue} className="animate-fadeInUp rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100 sm:p-6 lg:col-span-2">
            <div className="mb-5 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md">
                <Home size={19} />
              </span>
              <div>
                <h2 className="font-semibold text-gray-900">Shipping details</h2>
                <p className="text-xs text-gray-500">{user?.name ? `Delivering to ${user.name}` : 'All fields are required'}</p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <AuthInput label="Address" icon={Home} required autoComplete="street-address" delay={60}
                  placeholder="House no, street, area" value={address.line1} onChange={set('line1')} />
              </div>
              <AuthInput label="City" icon={Building2} required autoComplete="address-level2" delay={120}
                placeholder="City" value={address.city} onChange={set('city')} />
              <AuthInput label="State" icon={Map} required autoComplete="address-level1" delay={180}
                placeholder="State" value={address.state} onChange={set('state')} />
              <AuthInput label="Pincode" icon={Hash} required inputMode="numeric" pattern="[0-9]{6}" title="6-digit pincode"
                autoComplete="postal-code" delay={240} placeholder="6-digit pincode" value={address.pincode} onChange={set('pincode')} />
              <AuthInput label="Phone" icon={Phone} type="tel" required pattern="[0-9+ ]{10,15}" title="10-digit phone number"
                autoComplete="tel" delay={300} placeholder="Mobile number" value={address.phone} onChange={set('phone')} />
            </div>

            <div className="mt-6 flex flex-col-reverse gap-3 border-t border-gray-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
              <Link to="/cart" className="text-center text-sm font-medium text-teal-600 hover:underline">← Back to cart</Link>
              <button className="flex items-center justify-center gap-2 rounded-full bg-brand-600 px-7 py-3 text-sm font-semibold text-white">
                Continue to payment <ArrowRight size={16} />
              </button>
            </div>
          </form>

          <OrderSummary items={items} showItems accent="from-emerald-500 via-teal-500 to-cyan-600" />
        </div>
      </div>
    </div>
  );
}
