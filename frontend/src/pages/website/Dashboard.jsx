import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { LayoutDashboard, Package, Truck, CheckCircle2, Wallet, ArrowRight, ShoppingBag, UserCircle2, KeyRound } from 'lucide-react';
import { fetchMyOrders } from '../../store/slices/website/myOrderSlice';
import { socket } from '../../services/socket';
import useSeo from '../../hooks/useSeo';
import AccountLayout from '../../components/website/account/AccountLayout';
import OrderCard from '../../components/website/account/OrderCard';
import OrderDetailsModal from '../../components/website/account/OrderDetailsModal';
import { statusGroup, money } from '../../utils/orderStatus';

function useCountUp(value, duration = 900) {
  const [shown, setShown] = useState(0);
  const from = useRef(0);
  useEffect(() => {
    const start = performance.now();
    const origin = from.current;
    let raf;
    const tick = (now) => {
      const p = Math.min(1, (now - start) / duration);
      setShown(origin + (value - origin) * (1 - Math.pow(1 - p, 3)));
      if (p < 1) raf = requestAnimationFrame(tick); else from.current = value;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);
  return shown;
}

function StatCard({ label, value, icon: Icon, gradient, to, delay, format = (v) => Math.round(v).toLocaleString('en-IN') }) {
  const shown = useCountUp(value);
  return (
    <Link
      to={to}
      className={`group relative isolate animate-fadeInUp overflow-hidden rounded-2xl bg-gradient-to-br ${gradient} p-5 text-white shadow-md transition-all duration-500 hover:-translate-y-1.5 hover:scale-[1.02] hover:shadow-xl`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <span className="absolute -right-6 -top-6 -z-10 h-24 w-24 rounded-full bg-white/10 transition-transform duration-500 group-hover:scale-150" />
      <span className="absolute inset-0 -z-10 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/20 ring-1 ring-white/30 backdrop-blur group-hover:animate-wiggle">
        <Icon size={22} />
      </span>
      <p className="mt-4 truncate text-2xl font-bold tabular-nums drop-shadow-sm sm:text-3xl">{format(shown)}</p>
      <p className="mt-0.5 flex items-center justify-between text-sm text-white/90">
        {label} <ArrowRight size={15} className="-translate-x-2 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100" />
      </p>
    </Link>
  );
}

export default function Dashboard() {
  useSeo({ title: 'My account', noindex: true });
  const user = useSelector((s) => s.auth.user);
  const navigate = useNavigate();
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
  const active = list.filter((o) => statusGroup(o.status) === 'active');
  const completed = list.filter((o) => statusGroup(o.status) === 'completed');
  const spent = list.filter((o) => statusGroup(o.status) !== 'cancelled').reduce((a, o) => a + Number(o.total_amount), 0);
  const firstName = (user?.name || '').split(' ')[0];

  return (
    <AccountLayout icon={LayoutDashboard} title="Dashboard" subtitle={`Welcome back${firstName ? `, ${firstName}` : ''}!`}>
      <div className="space-y-8">
        {/* Stat cards - click through to the matching order list */}
        <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
          {orders === null
            ? [0, 1, 2, 3].map((i) => <div key={i} className="h-[140px] animate-shimmer rounded-2xl bg-gradient-to-r from-gray-100 via-white to-gray-100 bg-[length:200%_100%]" />)
            : (
              <>
                <StatCard label="Total orders" value={list.length} icon={Package} gradient="from-orange-500 to-rose-500" to="/my-orders" delay={0} />
                <StatCard label="In progress" value={active.length} icon={Truck} gradient="from-sky-500 to-indigo-600" to="/my-orders?tab=active" delay={80} />
                <StatCard label="Completed" value={completed.length} icon={CheckCircle2} gradient="from-emerald-500 to-teal-600" to="/my-orders?tab=completed" delay={160} />
                <StatCard label="Total spent" value={spent} icon={Wallet} gradient="from-violet-500 to-fuchsia-600" to="/my-orders" delay={240} format={money} />
              </>
            )}
        </div>

        {/* Recent orders */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">Recent orders</h2>
            {list.length > 0 && (
              <Link to="/my-orders" className="group flex items-center gap-1 text-sm font-medium text-rose-600">
                View all <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
              </Link>
            )}
          </div>
          {orders !== null && list.length === 0 ? (
            <div className="flex animate-scaleIn flex-col items-center rounded-2xl bg-white py-12 text-center shadow-sm ring-1 ring-gray-100">
              <span className="flex h-20 w-20 animate-float items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-rose-500 text-white shadow-lg">
                <ShoppingBag size={34} />
              </span>
              <p className="mt-4 font-semibold text-gray-900">No orders yet</p>
              <p className="text-sm text-gray-500">Your orders will show up here.</p>
              <Link to="/products" className="mt-5 rounded-full bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white">Start shopping</Link>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {list.slice(0, 4).map((o, i) => <OrderCard key={o.id} order={o} index={i} onClick={() => setOpenId(o.id)} />)}
            </div>
          )}
        </section>

        {/* Quick links */}
        <section className="grid gap-4 sm:grid-cols-2">
          {[
            { to: '/profile', icon: UserCircle2, title: 'Edit profile', text: 'Update your name and phone', color: 'from-cyan-500 to-blue-600' },
            { to: '/change-password', icon: KeyRound, title: 'Change password', text: 'Keep your account secure', color: 'from-amber-500 to-orange-600' },
          ].map(({ to, icon: Icon, title, text, color }, i) => (
            <button
              key={to} onClick={() => navigate(to)}
              className="group flex animate-fadeInUp items-center gap-4 rounded-2xl bg-white p-4 text-left shadow-sm ring-1 ring-gray-100 transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
              style={{ animationDelay: `${300 + i * 80}ms` }}
            >
              <span className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${color} text-white shadow transition-transform duration-300 group-hover:rotate-6 group-hover:scale-110`}><Icon size={22} /></span>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold text-gray-900">{title}</span>
                <span className="block text-sm text-gray-500">{text}</span>
              </span>
              <ArrowRight size={18} className="text-gray-300 transition-all group-hover:translate-x-1 group-hover:text-rose-500" />
            </button>
          ))}
        </section>
      </div>

      <OrderDetailsModal orderId={openId} open={!!openId} onClose={() => setOpenId(null)} onChanged={load} />
    </AccountLayout>
  );
}
