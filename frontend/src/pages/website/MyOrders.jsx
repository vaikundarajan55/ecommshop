import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Package, PackageSearch } from 'lucide-react';
import { fetchMyOrders } from '../../store/slices/website/myOrderSlice';
import { socket } from '../../services/socket';
import useSeo from '../../hooks/useSeo';
import AccountLayout from '../../components/website/account/AccountLayout';
import OrderCard from '../../components/website/account/OrderCard';
import OrderDetailsModal from '../../components/website/account/OrderDetailsModal';
import { statusGroup } from '../../utils/orderStatus';

const TABS = [
  { id: 'all', label: 'All' },
  { id: 'active', label: 'In progress' },
  { id: 'completed', label: 'Completed' },
  { id: 'cancelled', label: 'Cancelled' },
];

export default function MyOrders() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = TABS.some((t) => t.id === searchParams.get('tab')) ? searchParams.get('tab') : 'all';
  useSeo({ title: tab === 'completed' ? 'Completed orders' : 'My orders', noindex: true });
  const dispatch = useDispatch();
  const orders = useSelector((s) => s.myOrders.items);
  const [openId, setOpenId] = useState(null);

  const load = () => dispatch(fetchMyOrders());

  useEffect(() => {
    load();
    const refresh = () => load();
    socket.on('order_status_updated', refresh);
    return () => socket.off('order_status_updated', refresh);
  }, []);

  const list = orders || [];
  const counts = TABS.reduce((acc, t) => ({ ...acc, [t.id]: t.id === 'all' ? list.length : list.filter((o) => statusGroup(o.status) === t.id).length }), {});
  const shown = tab === 'all' ? list : list.filter((o) => statusGroup(o.status) === tab);

  return (
    <AccountLayout
      icon={Package}
      title={tab === 'completed' ? 'Completed orders' : 'My orders'}
      subtitle={tab === 'completed' ? 'Orders that have been delivered' : 'Track, review and download invoices'}
    >
      <div className="mb-5 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]" role="tablist" aria-label="Order status">
        {TABS.map((t, i) => {
          const selected = t.id === tab;
          return (
            <button
              key={t.id} role="tab" aria-selected={selected}
              onClick={() => setSearchParams(t.id === 'all' ? {} : { tab: t.id })}
              className={`flex shrink-0 animate-scaleIn items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all duration-300 ${
                selected ? 'bg-gradient-to-r from-orange-500 to-rose-500 text-white shadow-md shadow-rose-500/25' : 'bg-white text-gray-600 ring-1 ring-gray-200 hover:text-rose-600 hover:ring-rose-200'
              }`}
              style={{ animationDelay: `${i * 50}ms` }}
            >
              {t.label}
              <span className={`rounded-full px-1.5 text-xs tabular-nums ${selected ? 'bg-white/25' : 'bg-gray-100 text-gray-500'}`}>{orders ? counts[t.id] : '·'}</span>
            </button>
          );
        })}
      </div>

      {orders === null ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {[0, 1, 2, 3].map((i) => <div key={i} className="h-[150px] animate-shimmer rounded-2xl bg-gradient-to-r from-gray-100 via-white to-gray-100 bg-[length:200%_100%]" />)}
        </div>
      ) : shown.length === 0 ? (
        <div className="flex animate-scaleIn flex-col items-center rounded-2xl bg-white py-14 text-center shadow-sm ring-1 ring-gray-100">
          <span className="flex h-20 w-20 animate-float items-center justify-center rounded-full bg-gradient-to-br from-orange-100 to-rose-100 text-rose-500">
            <PackageSearch size={34} />
          </span>
          <p className="mt-4 font-semibold text-gray-900">No {tab === 'all' ? '' : `${TABS.find((t) => t.id === tab).label.toLowerCase()} `}orders</p>
          <Link to="/products" className="mt-4 text-sm font-medium text-rose-600 hover:underline">Continue shopping</Link>
        </div>
      ) : (
        // key={tab} replays the entrance animation when switching tabs
        <div key={tab} className="grid gap-4 sm:grid-cols-2">
          {shown.map((o, i) => <OrderCard key={o.id} order={o} index={i} onClick={() => setOpenId(o.id)} selected={openId === o.id} />)}
        </div>
      )}

      <OrderDetailsModal orderId={openId} open={!!openId} onClose={() => setOpenId(null)} onChanged={load} />
    </AccountLayout>
  );
}
