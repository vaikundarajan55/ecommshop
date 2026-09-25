import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Minus, Plus, Trash2, ArrowRight, ShoppingBag } from 'lucide-react';
import { updateQuantity, removeFromCart } from '../../store/slices/website/cartSlice';
import { imageUrl } from '../../utils/imageUrl';
import { notify } from '../../utils/notify';
import useSeo from '../../hooks/useSeo';
import PageHero from '../../components/website/common/PageHero';
import CheckoutSteps from '../../components/website/common/CheckoutSteps';
import OrderSummary from '../../components/website/common/OrderSummary';

const money = (v) => `₹${Number(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function Cart() {
  useSeo({ title: 'Your cart', noindex: true });
  const items = useSelector((s) => s.cart.items);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [removing, setRemoving] = useState([]); // ids animating out
  const count = items.reduce((a, i) => a + i.quantity, 0);

  // Let the row slide out before it leaves the store
  const remove = (item) => {
    setRemoving((r) => [...r, item.productId]);
    setTimeout(() => {
      dispatch(removeFromCart(item.productId));
      setRemoving((r) => r.filter((id) => id !== item.productId));
      notify.deleted(`${item.name} removed from cart`);
    }, 300);
  };

  return (
    <div>
      <PageHero
        theme="cart" icon={ShoppingCart} title="Your cart"
        subtitle={items.length ? `${count} item${count === 1 ? '' : 's'} ready for checkout` : 'Nothing here yet'}
        crumbs={[{ label: 'Cart' }]}
      >
        {items.length > 0 && <div className="max-w-xl"><CheckoutSteps current={0} /></div>}
      </PageHero>

      <div className="mx-auto max-w-6xl px-4 py-8">
        {items.length === 0 ? (
          <div className="flex animate-scaleIn flex-col items-center rounded-3xl bg-white py-16 text-center shadow-sm ring-1 ring-gray-100">
            <span className="relative flex h-24 w-24 items-center justify-center">
              <span className="absolute inset-0 animate-ping rounded-full bg-orange-100" />
              <span className="relative flex h-24 w-24 animate-float items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-rose-500 text-white shadow-xl">
                <ShoppingBag size={40} />
              </span>
            </span>
            <h2 className="mt-6 text-xl font-bold text-gray-900">Your cart is empty</h2>
            <p className="mt-1 text-sm text-gray-500">Looks like you haven&apos;t added anything yet.</p>
            <Link to="/products" className="mt-6 inline-flex items-center gap-2 rounded-full bg-brand-600 px-6 py-3 text-sm font-semibold text-white">
              Start shopping <ArrowRight size={16} />
            </Link>
          </div>
        ) : (
          <div className="grid items-start gap-6 lg:grid-cols-3">
            <ul className="space-y-3 lg:col-span-2">
              {items.map((item, i) => {
                const leaving = removing.includes(item.productId);
                return (
                  <li
                    key={item.productId}
                    className={`group flex gap-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100 transition-all duration-300 hover:shadow-md hover:ring-orange-200 ${
                      leaving ? 'translate-x-8 scale-95 opacity-0' : 'animate-fadeInUp'
                    }`}
                    style={{ animationDelay: `${i * 70}ms` }}
                  >
                    <Link to={`/products/${item.productId}`} className="shrink-0 overflow-hidden rounded-xl">
                      {item.image
                        ? <img src={imageUrl(item.image)} alt={item.name} className="h-20 w-20 object-cover transition-transform duration-500 group-hover:scale-110 sm:h-24 sm:w-24" />
                        : <span className="block h-20 w-20 bg-gradient-to-br from-amber-50 to-orange-100 sm:h-24 sm:w-24" />}
                    </Link>
                    <div className="flex min-w-0 flex-1 flex-col justify-between gap-2 sm:flex-row sm:items-center">
                      <div className="min-w-0">
                        <Link to={`/products/${item.productId}`} className="line-clamp-2 font-medium text-gray-900 hover:text-orange-600">{item.name}</Link>
                        <p className="mt-0.5 text-sm text-gray-500">{money(item.price)} each</p>
                      </div>
                      <div className="flex items-center justify-between gap-4 sm:justify-end">
                        <div className="flex items-center rounded-full border border-gray-200">
                          <button
                            onClick={() => dispatch(updateQuantity({ productId: item.productId, quantity: item.quantity - 1 }))}
                            disabled={item.quantity <= 1} aria-label="Decrease quantity"
                            className="flex h-8 w-8 items-center justify-center rounded-l-full text-gray-600 hover:bg-gray-50 disabled:opacity-40"
                          ><Minus size={14} /></button>
                          <span key={item.quantity} className="w-8 animate-pop text-center text-sm font-semibold tabular-nums">{item.quantity}</span>
                          <button
                            onClick={() => dispatch(updateQuantity({ productId: item.productId, quantity: item.quantity + 1 }))}
                            aria-label="Increase quantity"
                            className="flex h-8 w-8 items-center justify-center rounded-r-full text-gray-600 hover:bg-gray-50"
                          ><Plus size={14} /></button>
                        </div>
                        <p className="w-24 text-right font-semibold tabular-nums text-gray-900">{money(item.price * item.quantity)}</p>
                        <button
                          onClick={() => remove(item)} aria-label={`Remove ${item.name}`}
                          className="rounded-full p-2 text-gray-400 transition-all hover:rotate-12 hover:bg-red-50 hover:text-red-600"
                        ><Trash2 size={17} /></button>
                      </div>
                    </div>
                  </li>
                );
              })}
              <li className="pt-2">
                <Link to="/products" className="text-sm font-medium text-orange-600 hover:underline">← Continue shopping</Link>
              </li>
            </ul>

            <OrderSummary items={items} accent="from-amber-500 via-orange-500 to-rose-500">
              <button
                onClick={() => navigate('/checkout')}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-brand-600 py-3 text-sm font-semibold text-white"
              >
                Proceed to checkout <ArrowRight size={16} />
              </button>
            </OrderSummary>
          </div>
        )}
      </div>
    </div>
  );
}
