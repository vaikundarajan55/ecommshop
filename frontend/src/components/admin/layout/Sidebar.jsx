import { useEffect, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import {
  LayoutDashboard, FolderTree, ListTree, Package, ClipboardList, Users, KeyRound, BarChart3,
  ChevronsLeft, ChevronDown, X, LogOut, Wallet, Images, MessageSquareQuote, Info, Mail, Home, Store, Globe,
} from 'lucide-react';
import { useAdminUI } from '../../../context/AdminUIContext';
import { logout } from '../../../store/slices/admin/adminAuthSlice';
import { notify } from '../../../utils/notify';
import { confirmDialog } from '../../common/ConfirmDialog';

// An item with `children` is a collapsible group (e.g. Home > Banners, Testimonials)
const links = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  {
    label: 'Home', icon: Home,
    children: [
      { to: '/admin/banners', label: 'Banners', icon: Images },
      { to: '/admin/about-page', label: 'About Us', icon: Info },
      { to: '/admin/testimonials', label: 'Testimonials', icon: MessageSquareQuote },
      { to: '/admin/shop-settings', label: 'Contact Us', icon: Store },
    ],
  },
  { to: '/admin/categories', label: 'Category', icon: FolderTree },
  { to: '/admin/subcategories', label: 'Subcategory', icon: ListTree },
  { to: '/admin/products', label: 'Product', icon: Package },
  {
    label: 'Orders', icon: ClipboardList,
    children: [
      { to: '/admin/orders', label: 'Order List', icon: ClipboardList },
      { to: '/admin/orders/report', label: 'Order Report', icon: BarChart3 },
    ],
  },
  { to: '/admin/users', label: 'User List', icon: Users },
  { to: '/admin/payment-methods', label: 'Payment Methods', icon: Wallet },
  { to: '/admin/contact-messages', label: 'Enquiry', icon: Mail },
  { to: '/admin/visitors', label: 'Visitors', icon: Globe },
  { to: '/admin/change-password', label: 'Change Password', icon: KeyRound },
];

// Admin theme gradient (--cp-gradient / --cp-gradient-shadow in index.css), slowly shifting
const SIDEBAR_BG = 'cp-gradient animate-gradient motion-reduce:animate-none';
// Active: white pill, blue text, pulsing glow (slide-in + glow combined - a second animate-* class would replace the first)
const ACTIVE = 'bg-white text-sky-700 [animation:slideInLeft_.35s_ease-out_both,glow_2.8s_ease-in-out_infinite] motion-reduce:[animation:none]';
// Collapsed group whose page is active (its wrapper already slides in, so only the glow here)
const GROUP_ACTIVE = 'bg-white text-sky-700 animate-glow motion-reduce:animate-none';
const IDLE = 'animate-slideInLeft text-white hover:translate-x-1 hover:bg-white/15 hover:text-white';

// Two blurred light blobs drifting behind the menu
function SunsetBlobs() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <span className="absolute -left-10 top-16 h-40 w-40 animate-blob rounded-full bg-cyan-300/25 blur-3xl motion-reduce:animate-none" />
      <span className="absolute -right-12 bottom-24 h-48 w-48 animate-blob rounded-full bg-blue-400/30 blur-3xl motion-reduce:animate-none [animation-delay:-4s]" />
    </div>
  );
}

function Label({ collapsed, children }) {
  return (
    <span className={`whitespace-nowrap transition-all duration-200 ${collapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
      {children}
    </span>
  );
}

function NavItem({ to, label, icon: Icon, collapsed, onNavigate, delay, sub = false }) {
  return (
    <NavLink
      to={to}
      end={to === '/admin/orders'}
      onClick={onNavigate}
      title={collapsed ? label : undefined}
      className={({ isActive }) =>
        `group relative flex items-center gap-3 overflow-hidden rounded-lg text-sm font-medium transition-all duration-200 ${
          sub ? 'py-1.5 pl-3 pr-3' : 'px-3 py-2'
        } ${isActive ? ACTIVE : IDLE} ${collapsed ? 'justify-center' : ''}`
      }
      style={{ animationDelay: `${delay}ms` }}
    >
      {({ isActive }) => (
        <>
          <span className={`absolute left-0 top-0 h-full w-1 rounded-r bg-gradient-to-b from-blue-600 to-cyan-500 transition-transform duration-200 ${isActive ? 'scale-y-100' : 'scale-y-0'}`} />
          {/* light sweeping across the active item */}
          {isActive && <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-sky-200/70 to-transparent animate-sheen motion-reduce:hidden" />}
          <Icon size={sub ? 16 : 18} className={`relative shrink-0 transition-transform duration-200 group-hover:scale-110 ${isActive ? 'text-sky-600' : ''}`} />
          <Label collapsed={collapsed}>{label}</Label>
        </>
      )}
    </NavLink>
  );
}

// Collapsible parent with an animated submenu; opens by itself when one of its pages is active
function NavGroup({ label, icon: Icon, children, collapsed, onNavigate, delay }) {
  const location = useLocation();
  const childActive = children.some((c) => location.pathname.startsWith(c.to));
  const [open, setOpen] = useState(childActive);

  useEffect(() => { if (childActive) setOpen(true); }, [childActive]);

  return (
    <div className="animate-slideInLeft" style={{ animationDelay: `${delay}ms` }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        title={collapsed ? label : undefined}
        className={`group relative flex w-full items-center gap-3 overflow-hidden rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 ${
          childActive && !open ? GROUP_ACTIVE : childActive ? 'bg-white/20 text-white' : 'text-white hover:translate-x-1 hover:bg-white/15'
        } ${collapsed ? 'justify-center' : ''}`}
      >
        <Icon size={18} className="shrink-0 transition-transform duration-200 group-hover:scale-110" />
        <Label collapsed={collapsed}>{label}</Label>
        {!collapsed && (
          <ChevronDown size={16} className={`ml-auto shrink-0 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
        )}
      </button>

      {/* grid-rows trick animates the height open/closed */}
      <div className={`grid transition-all duration-300 ease-out ${open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
        <div className="min-h-0 overflow-hidden">
          {/* key re-mounts the items so their slide-in replays each time the group opens */}
          <div key={open ? 'open' : 'closed'} className={`mt-1 flex flex-col gap-1 ${collapsed ? '' : 'ml-5 border-l-2 border-white/25 pl-2'}`}>
            {children.map((c, i) => (
              <NavItem key={c.to} {...c} sub collapsed={collapsed} onNavigate={onNavigate} delay={i * 60} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function SidebarContent({ collapsed, onNavigate }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = async () => {
    const ok = await confirmDialog({
      title: 'Log out?',
      message: 'You will need to sign in again to use the admin panel.',
      confirmText: 'Yes, logout',
    });
    if (!ok) return;
    onNavigate?.();
    dispatch(logout());
    notify.logout('You have been logged out');
    navigate('/admin/login');
  };

  return (
    <>
      <nav className="relative mt-2 flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto px-3 pb-3">
        {links.map((item, i) => (item.children
          ? <NavGroup key={item.label} {...item} collapsed={collapsed} onNavigate={onNavigate} delay={i * 40} />
          : <NavItem key={item.to} {...item} collapsed={collapsed} onNavigate={onNavigate} delay={i * 40} />
        ))}
      </nav>

      {/* Logout pinned to the bottom of the sidebar */}
      <div className="relative shrink-0 border-t border-white/20 p-3">
        <button
          onClick={handleLogout}
          title={collapsed ? 'Logout' : undefined}
          className={`group flex w-full animate-fadeInUp items-center gap-3 overflow-hidden rounded-md bg-white/10 px-3 py-2.5 text-sm font-semibold text-white ring-1 ring-inset ring-white/25 transition-all duration-200 hover:bg-white hover:text-blue-700 hover:shadow-lg hover:shadow-blue-900/30 active:scale-[0.97] ${
            collapsed ? 'justify-center' : ''
          }`}
        >
          <LogOut size={18} className="shrink-0 transition-transform duration-200 group-hover:translate-x-0.5" />
          <span className={`whitespace-nowrap transition-all duration-200 ${collapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
            Logout
          </span>
        </button>
      </div>
    </>
  );
}

export default function Sidebar() {
  const { collapsed, toggleCollapsed, mobileOpen, closeMobile } = useAdminUI();

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={`sticky top-0 hidden h-screen shrink-0 flex-col overflow-hidden text-white transition-[width] duration-300 ease-in-out md:flex ${SIDEBAR_BG} ${
          collapsed ? 'w-20' : 'w-64'
        }`}
      >
        <SunsetBlobs />
        <div className="relative flex h-16 shrink-0 items-center justify-between px-4 text-xl font-bold text-white">
          <span className={`overflow-hidden whitespace-nowrap text-white drop-shadow-sm transition-all duration-200 ${collapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
            Admin Panel
          </span>
          <button
            onClick={toggleCollapsed}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-white/80 transition-all duration-200 hover:bg-white/15 hover:text-white active:scale-90"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <span className={`inline-flex transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`}>
              <ChevronsLeft size={18} />
            </span>
          </button>
        </div>
        <SidebarContent collapsed={collapsed} />
      </aside>

      {/* Mobile off-canvas drawer */}
      <div
        className={`fixed inset-0 z-40 bg-black/40 backdrop-blur-[1px] transition-opacity duration-300 md:hidden ${
          mobileOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={closeMobile}
      />
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 transform flex-col overflow-hidden text-white shadow-2xl transition-transform duration-300 ease-in-out md:hidden ${SIDEBAR_BG} ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <SunsetBlobs />
        <div className="relative flex h-16 shrink-0 items-center justify-between px-4 text-xl font-bold text-white">
          <span className="text-white drop-shadow-sm">Admin Panel</span>
          <button
            onClick={closeMobile}
            className="flex h-8 w-8 items-center justify-center rounded-md text-white/80 transition-colors hover:bg-white/15 active:scale-90"
          >
            <X size={18} />
          </button>
        </div>
        <SidebarContent collapsed={false} onNavigate={closeMobile} />
      </aside>
    </>
  );
}
