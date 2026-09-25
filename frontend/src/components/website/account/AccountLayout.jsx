import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { LayoutDashboard, Package, CheckCircle2, UserCircle2, KeyRound, LogOut, Bot } from 'lucide-react';
import { logout } from '../../../store/slices/website/siteAuthSlice';
import { notify } from '../../../utils/notify';
import { confirmDialog } from '../../common/ConfirmDialog';
import PageHero from '../common/PageHero';

const LINKS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/my-orders', label: 'My orders', icon: Package },
  { to: '/my-orders?tab=completed', label: 'Completed orders', icon: CheckCircle2 },
  { to: '/assistant', label: 'AI Assistant', icon: Bot },
  { to: '/profile', label: 'Profile', icon: UserCircle2 },
  { to: '/change-password', label: 'Change password', icon: KeyRound },
];

// Customer account shell: hero + sidebar (desktop) / scrolling tabs (mobile) + page content
export default function AccountLayout({ title, subtitle, icon, children }) {
  const user = useSelector((s) => s.auth.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const initials = (user?.name || '?').split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();

  // "My orders" and "Completed orders" share a path, so for that path also compare ?tab=completed
  const onCompletedTab = new URLSearchParams(location.search).get('tab') === 'completed';
  const isActive = (to) => {
    const [path, query = ''] = to.split('?');
    if (location.pathname !== path) return false;
    if (path !== '/my-orders') return true;
    return (new URLSearchParams(query).get('tab') === 'completed') === onCompletedTab;
  };

  const handleLogout = async () => {
    const ok = await confirmDialog({ title: 'Log out?', message: 'You can sign back in any time.', confirmText: 'Yes, logout' });
    if (!ok) return;
    dispatch(logout());
    notify.logout('You have been logged out');
    navigate('/');
  };

  const linkCls = (active) => `group relative flex items-center gap-3 overflow-hidden rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-300 ${
    active
      ? 'bg-gradient-to-r from-orange-500 to-rose-500 text-white shadow-md shadow-rose-500/25'
      : 'text-gray-600 hover:translate-x-1 hover:bg-rose-50 hover:text-rose-600'
  }`;

  return (
    <div>
      <PageHero theme="account" icon={icon} title={title} subtitle={subtitle} crumbs={[{ label: 'My account', to: '/dashboard' }, { label: title }]} />

      <div className="mx-auto max-w-6xl px-4 py-8">
        {/* Mobile: horizontal tabs */}
        <nav aria-label="Account" className="-mx-4 mb-6 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] lg:hidden">
          {LINKS.map(({ to, label, icon: Icon }, i) => (
            <NavLink key={to} to={to} className={`shrink-0 animate-scaleIn ${linkCls(isActive(to))} !py-2`} style={{ animationDelay: `${i * 50}ms` }}>
              <Icon size={16} /> {label}
            </NavLink>
          ))}
          <button onClick={handleLogout} className="flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-red-600 ring-1 ring-red-100">
            <LogOut size={16} /> Logout
          </button>
        </nav>

        <div className="grid items-start gap-6 lg:grid-cols-[260px_1fr]">
          {/* Desktop sidebar */}
          <aside className="sticky top-24 hidden animate-slideInLeft overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-100 lg:block">
            <div className="relative bg-gradient-to-br from-orange-500 via-rose-500 to-fuchsia-600 px-5 pb-5 pt-6 text-white">
              <span className="flex h-14 w-14 animate-pop items-center justify-center rounded-full bg-white/20 text-lg font-bold ring-2 ring-white/40 backdrop-blur">
                {initials}
              </span>
              <p className="mt-3 truncate font-semibold">{user?.name}</p>
              <p className="truncate text-xs text-white/80">{user?.email}</p>
            </div>
            <nav aria-label="Account" className="space-y-1 p-3">
              {LINKS.map(({ to, label, icon: Icon }, i) => {
                const active = isActive(to);
                return (
                  <NavLink key={to} to={to} className={`${linkCls(active)} animate-fadeInUp`} style={{ animationDelay: `${150 + i * 60}ms` }}>
                    <Icon size={18} className="shrink-0 transition-transform duration-300 group-hover:scale-110" /> {label}
                  </NavLink>
                );
              })}
            </nav>
            <div className="border-t border-gray-100 p-3">
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-3 rounded-xl bg-red-50 px-3 py-2.5 text-sm font-semibold text-red-600 transition-all duration-300 hover:bg-red-600 hover:text-white"
              >
                <LogOut size={18} /> Logout
              </button>
            </div>
          </aside>

          <main className="min-w-0">{children}</main>
        </div>
      </div>
    </div>
  );
}
