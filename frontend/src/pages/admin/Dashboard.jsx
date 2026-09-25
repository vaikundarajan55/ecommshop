import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import {
  FolderTree, ListTree, Package, Users, ClipboardList, ArrowRight, RefreshCw, CalendarDays, Inbox,
} from 'lucide-react';
import { fetchDashboardSummary } from '../../store/slices/admin/dashboardSlice';
import { socket, connectAdminSocket } from '../../services/socket';
import { notify } from '../../utils/notify';
import DataTable from '../../components/admin/common/DataTable';
import StatusBadge from '../../components/admin/common/StatusBadge';

// ---- Chart colours (validated categorical palette, fixed order) ----
// Each weekday owns one slot, so a day keeps its colour as the 7-day window moves.
const WEEKDAY_COLORS = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#008300', '#4a3aa7']; // Sun..Sat
const LINE_COLOR = '#2a78d6';
const INK = { primary: '#1f2937', secondary: '#4b5563', muted: '#9ca3af', grid: '#eef0f3' };

const CARDS = [
  { key: 'categories', label: 'Categories', icon: FolderTree, to: '/admin/categories', gradient: 'from-indigo-500 via-indigo-600 to-violet-600', glow: 'hover:shadow-indigo-500/40' },
  { key: 'subcategories', label: 'Subcategories', icon: ListTree, to: '/admin/subcategories', gradient: 'from-sky-500 via-sky-600 to-cyan-600', glow: 'hover:shadow-sky-500/40' },
  { key: 'products', label: 'Products', icon: Package, to: '/admin/products', gradient: 'from-emerald-500 via-emerald-600 to-teal-600', glow: 'hover:shadow-emerald-500/40' },
  { key: 'users', label: 'Customers', icon: Users, to: '/admin/users', gradient: 'from-amber-500 via-orange-500 to-orange-600', glow: 'hover:shadow-orange-500/40' },
  { key: 'orders', label: 'Orders', icon: ClipboardList, to: '/admin/orders', gradient: 'from-rose-500 via-rose-600 to-pink-600', glow: 'hover:shadow-rose-500/40' },
];

const money = (v) => `₹${Number(v || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
const parseDay = (ymd) => new Date(`${ymd}T00:00:00`);
const dayLabel = (ymd) => parseDay(ymd).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' });
const dayLong = (ymd) => parseDay(ymd).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' });
const monthLabel = (ym) => parseDay(`${ym}-01`).toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
const timeOf = (dt) => (dt ? String(dt).slice(11, 16) : '');

// Counts up from the previous value to the new one
function useCountUp(value, duration = 900) {
  const [display, setDisplay] = useState(0);
  const fromRef = useRef(0);
  useEffect(() => {
    const from = fromRef.current;
    const start = performance.now();
    let raf;
    const tick = (now) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(from + (value - from) * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
      else fromRef.current = value;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);
  return display;
}

function StatCard({ label, value, icon: Icon, gradient, glow, onClick, delay }) {
  const shown = useCountUp(value);
  return (
    <button
      onClick={onClick}
      className={`group relative isolate animate-fadeInUp overflow-hidden rounded-xl bg-gradient-to-br ${gradient} bg-[length:150%_150%] bg-left-top p-5 text-left text-white shadow-md transition-all duration-500 ease-out hover:-translate-y-1.5 hover:scale-[1.03] hover:bg-right-bottom hover:shadow-xl ${glow} active:scale-[0.98]`}
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* decorative circles grow on hover */}
      <span className="absolute -right-6 -top-6 -z-10 h-24 w-24 rounded-full bg-white/10 transition-transform duration-500 group-hover:scale-150" />
      <span className="absolute -bottom-10 right-8 -z-10 h-20 w-20 rounded-full bg-white/10 transition-transform duration-700 group-hover:-translate-y-3 group-hover:scale-125" />
      {/* shine sweep */}
      <span className="absolute inset-0 -z-10 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full" />

      <div className="flex items-start justify-between">
        <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-white/20 ring-1 ring-white/30 backdrop-blur-sm group-hover:animate-wiggle">
          <Icon size={22} />
        </span>
        <span className="flex items-center gap-1 rounded-full bg-white/0 px-2 py-0.5 text-xs font-medium opacity-0 transition-all duration-300 group-hover:bg-white/20 group-hover:opacity-100">
          Open <ArrowRight size={13} className="transition-transform duration-300 group-hover:translate-x-0.5" />
        </span>
      </div>
      <p className="mt-4 text-3xl font-bold drop-shadow-sm">{shown.toLocaleString('en-IN')}</p>
      <p className="mt-0.5 text-sm text-white/85">{label}</p>
    </button>
  );
}

function ChartTooltip({ active, payload, title }) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  return (
    <div className="rounded-lg bg-white px-3 py-2 text-xs shadow-lg ring-1 ring-black/5">
      <p className="mb-1 font-semibold text-gray-800">{title(row)}</p>
      <p className="text-gray-600"><span className="font-semibold text-gray-800">{row.orders}</span> order{row.orders === 1 ? '' : 's'}</p>
      <p className="text-gray-600">{money(row.revenue)} revenue</p>
    </div>
  );
}

function EmptyChart({ text }) {
  return (
    <div className="flex h-full min-h-[220px] animate-fadeIn flex-col items-center justify-center gap-2 text-sm text-gray-400">
      <Inbox size={30} />
      {text}
    </div>
  );
}

function Card({ title, subtitle, delay = 0, children, className = '' }) {
  return (
    <section
      className={`animate-fadeInUp rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-100 ${className}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
        {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { data, loading: refreshing } = useSelector((state) => state.dashboard);

  const load = () => dispatch(fetchDashboardSummary()).unwrap().catch(notify.error);

  useEffect(() => {
    load();
    connectAdminSocket();
    const onNewOrder = (payload) => {
      notify.success(`New order received: ${payload.orderNo}`);
      load();
    };
    const onStatusUpdated = () => load();
    socket.on('new_order', onNewOrder);
    socket.on('order_status_updated', onStatusUpdated);
    return () => {
      socket.off('new_order', onNewOrder);
      socket.off('order_status_updated', onStatusUpdated);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const counts = data?.counts || {};
  const dayWise = (data?.dayWise || []).map((d) => ({ ...d, label: dayLabel(d.date), color: WEEKDAY_COLORS[parseDay(d.date).getDay()] }));
  const weekTotal = dayWise.reduce((a, d) => a + d.orders, 0);
  const monthWise = (data?.monthWise || []).map((m) => ({ ...m, label: monthLabel(m.month) }));
  const yearTotal = monthWise.reduce((a, m) => a + m.orders, 0);
  const thisMonth = monthWise[monthWise.length - 1];
  const todayOrders = data?.todayOrders || [];
  const todayRevenue = todayOrders
    .filter((o) => !['cancelled', 'returned'].includes(o.status))
    .reduce((a, o) => a + Number(o.total_amount), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Dashboard</h2>
          {data && <p className="text-sm text-gray-500">{dayLong(data.today)} · updates live when orders come in</p>}
        </div>
        <button
          onClick={load} disabled={refreshing}
          className="flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-600 shadow-sm transition-colors hover:bg-gray-50 disabled:opacity-60"
        >
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {/* ---- Count cards: click opens that page ---- */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
        {data
          ? CARDS.map((c, i) => (
            <StatCard key={c.key} {...c} value={counts[c.key] || 0} delay={i * 70} onClick={() => navigate(c.to)} />
          ))
          : CARDS.map((c) => <div key={c.key} className="h-[140px] animate-shimmer rounded-xl bg-gradient-to-r from-gray-100 via-gray-50 to-gray-100 bg-[length:200%_100%]" />)}
      </div>

      {/* ---- Charts ---- */}
      <div className="grid gap-6 lg:grid-cols-5">
        <Card title="Orders by day" subtitle="Last 7 days" delay={350} className="lg:col-span-2">
          {!data ? (
            <div className="h-[240px]" />
          ) : weekTotal === 0 ? (
            <EmptyChart text="No orders in the last 7 days" />
          ) : (
            <div className="flex flex-col items-center gap-4 sm:flex-row lg:flex-col xl:flex-row">
              <div className="relative h-[200px] w-[200px] shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={dayWise.filter((d) => d.orders > 0)} dataKey="orders" nameKey="label"
                      innerRadius={62} outerRadius={92} paddingAngle={2} cornerRadius={4}
                      stroke="#ffffff" strokeWidth={2} animationDuration={900}
                    >
                      {dayWise.filter((d) => d.orders > 0).map((d) => <Cell key={d.date} fill={d.color} />)}
                    </Pie>
                    <Tooltip content={<ChartTooltip title={(r) => dayLong(r.date)} />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold text-gray-800">{weekTotal}</span>
                  <span className="text-xs text-gray-500">orders</span>
                </div>
              </div>
              {/* Legend doubles as the value table - every day, with its count */}
              <ul className="w-full space-y-1.5 text-sm">
                {dayWise.map((d, i) => (
                  <li key={d.date} className="flex animate-slideInRight items-center gap-2" style={{ animationDelay: `${500 + i * 50}ms` }}>
                    <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: d.color }} />
                    <span className={`flex-1 ${d.date === data.today ? 'font-semibold text-gray-800' : 'text-gray-600'}`}>
                      {d.label}{d.date === data.today ? ' (today)' : ''}
                    </span>
                    <span className="tabular-nums font-medium text-gray-800">{d.orders}</span>
                    <span className="w-10 text-right tabular-nums text-xs text-gray-400">
                      {Math.round((d.orders / weekTotal) * 100)}%
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card>

        <Card
          title="Orders by month"
          subtitle={thisMonth ? `Last 12 months · ${thisMonth.orders} orders, ${money(thisMonth.revenue)} this month` : 'Last 12 months'}
          delay={420} className="lg:col-span-3"
        >
          {!data ? (
            <div className="h-[240px]" />
          ) : yearTotal === 0 ? (
            <EmptyChart text="No orders in the last 12 months" />
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={monthWise} margin={{ top: 10, right: 16, left: -12, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke={INK.grid} />
                <XAxis dataKey="label" tickLine={false} axisLine={{ stroke: '#e5e7eb' }} tick={{ fontSize: 12, fill: INK.muted }} interval="preserveStartEnd" />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: INK.muted }} width={40} />
                <Tooltip
                  content={<ChartTooltip title={(r) => parseDay(`${r.month}-01`).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })} />}
                  cursor={{ stroke: '#d1d5db', strokeDasharray: '3 3' }}
                />
                <Line
                  type="monotone" dataKey="orders" stroke={LINE_COLOR} strokeWidth={2}
                  dot={{ r: 4, fill: LINE_COLOR, stroke: '#ffffff', strokeWidth: 2 }}
                  activeDot={{ r: 6, stroke: '#ffffff', strokeWidth: 2 }}
                  animationDuration={1200}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      {/* ---- Today's orders ---- */}
      <section className="animate-fadeInUp space-y-3" style={{ animationDelay: '500ms' }}>
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-800">
              <CalendarDays size={16} className="text-primary-600" /> Today&apos;s orders
            </h3>
            <p className="text-xs text-gray-500">
              {todayOrders.length} order{todayOrders.length === 1 ? '' : 's'} · {money(todayRevenue)} revenue
            </p>
          </div>
          <button onClick={() => navigate('/admin/orders')} className="flex items-center gap-1 text-sm font-medium text-primary-600 hover:underline">
            All orders <ArrowRight size={14} />
          </button>
        </div>
        <DataTable
          columns={[
            { key: 'order_no', label: 'Order No', render: (r) => <span className="font-medium text-gray-800">{r.order_no}</span> },
            {
              key: 'customer_name', label: 'Customer',
              render: (r) => (
                <div>
                  <p className="text-gray-800">{r.customer_name}</p>
                  <p className="text-xs text-gray-400">{r.customer_email}</p>
                </div>
              ),
            },
            { key: 'item_count', label: 'Items' },
            { key: 'total_amount', label: 'Amount', render: (r) => <span className="tabular-nums font-medium">{money(r.total_amount)}</span> },
            {
              key: 'payment_status', label: 'Payment',
              render: (r) => (
                <div className="flex flex-col items-start gap-0.5">
                  <StatusBadge status={r.payment_status} />
                  <span className="text-xs uppercase text-gray-400">{r.payment_method}</span>
                </div>
              ),
            },
            { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
            { key: 'created_at', label: 'Time', render: (r) => <span className="tabular-nums text-gray-500">{timeOf(r.created_at)}</span> },
          ]}
          rows={todayOrders}
          pageSize={6}
          emptyText="No orders yet today"
        />
      </section>
    </div>
  );
}
