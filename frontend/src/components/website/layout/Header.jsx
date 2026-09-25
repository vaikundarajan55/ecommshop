import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { ShoppingCart, User, LogOut, Menu, X, ShoppingBag } from 'lucide-react';
import { logout } from '../../../store/slices/website/siteAuthSlice';
import { notify } from '../../../utils/notify';
import { imageUrl } from '../../../utils/imageUrl';
import useShop from '../../../hooks/useShop';

const NAV = [
  { to: '/', label: 'Home', end: true },
  { to: '/about', label: 'About' },
  { to: '/products', label: 'Products' },
  { to: '/contact', label: 'Contact us' },
];

export default function Header() {
  const cartItems = useSelector((s) => s.cart.items);
  const user = useSelector((s) => s.auth.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const shop = useShop();
  const cartCount = cartItems.reduce((a, i) => a + i.quantity, 0);

  // Close the mobile menu whenever the route changes
  useEffect(() => { setMenuOpen(false); }, [location.pathname]);

  const handleLogout = () => {
    dispatch(logout());
    notify.logout('You have been logged out');
    navigate('/');
  };

  const navCls = ({ isActive }) =>
    `relative py-1 transition-colors after:absolute after:inset-x-0 after:-bottom-0.5 after:h-0.5 after:origin-left after:rounded-full after:bg-brand-600 after:transition-transform after:duration-300 hover:text-brand-600 ${
      isActive ? 'text-brand-600 after:scale-x-100' : 'after:scale-x-0 hover:after:scale-x-100'
    }`;

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4">
        <Link to="/" className="group flex min-w-0 items-center gap-2 text-xl font-bold text-brand-600" aria-label={`${shop.shop_name} home`}>
          {shop.logo
            ? <img src={imageUrl(shop.logo)} alt="" className="h-9 w-9 shrink-0 rounded-lg object-contain transition-transform duration-300 group-hover:scale-110" />
            : <ShoppingBag size={22} className="shrink-0 transition-transform duration-300 group-hover:rotate-6" />}
          <span className="truncate">{shop.shop_name}</span>
        </Link>

        <nav aria-label="Main" className="hidden gap-7 text-sm font-medium text-gray-600 md:flex">
          {NAV.map((n) => <NavLink key={n.to} to={n.to} end={n.end} className={navCls}>{n.label}</NavLink>)}
        </nav>

        <div className="flex items-center gap-2 sm:gap-4">
          <Link to="/cart" className="relative rounded-full p-2 transition-colors hover:bg-brand-50" aria-label={`Cart, ${cartCount} items`}>
            <ShoppingCart size={22} />
            {cartCount > 0 && (
              <span key={cartCount} className="absolute right-0 top-0 flex h-4 min-w-4 animate-pop items-center justify-center rounded-full bg-brand-600 px-1 text-[10px] text-white">
                {cartCount}
              </span>
            )}
          </Link>

          {/* tablet / desktop account area */}
          <div className="hidden items-center gap-3 sm:flex">
            {user ? (
              <>
                <Link to="/dashboard" className="flex max-w-[10rem] items-center gap-1 text-sm text-gray-600 hover:text-brand-600">
                  <User size={18} className="shrink-0" /> <span className="truncate">{user.name}</span>
                </Link>
                <button onClick={handleLogout} className="rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700" aria-label="Log out">
                  <LogOut size={18} />
                </button>
              </>
            ) : (
              <Link to="/login" className="rounded-md bg-brand-600 px-4 py-1.5 text-sm font-medium text-white">Login</Link>
            )}
          </div>

          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="rounded-md p-2 text-gray-600 transition-colors hover:bg-gray-100 md:hidden"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'} aria-expanded={menuOpen}
          >
            <span className={`block transition-transform duration-300 ${menuOpen ? 'rotate-90' : ''}`}>
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </span>
          </button>
        </div>
      </div>

      {/* ---- Mobile menu ---- */}
      <div className={`grid overflow-hidden border-t border-gray-100 bg-white transition-all duration-300 ease-out md:hidden ${menuOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] border-transparent opacity-0'}`}>
        <div className="min-h-0">
          <nav aria-label="Mobile" className="flex flex-col px-4 py-3 text-sm font-medium">
            {NAV.map((n, i) => (
              <NavLink
                key={n.to} to={n.to} end={n.end}
                className={({ isActive }) => `rounded-lg px-3 py-2.5 transition-colors ${isActive ? 'bg-brand-50 text-brand-700' : 'text-gray-700 hover:bg-gray-50'} ${menuOpen ? 'animate-slideInLeft' : ''}`}
                style={{ animationDelay: `${i * 50}ms` }}
              >
                {n.label}
              </NavLink>
            ))}
            <div className="mt-2 border-t border-gray-100 pt-3 sm:hidden">
              {user ? (
                <div className="flex items-center justify-between gap-2">
                  <Link to="/dashboard" className="flex min-w-0 items-center gap-2 rounded-lg px-3 py-2.5 text-gray-700 hover:bg-gray-50">
                    <User size={18} className="shrink-0" /> <span className="truncate">{user.name}</span>
                  </Link>
                  <button onClick={handleLogout} className="flex items-center gap-1.5 rounded-lg px-3 py-2.5 text-red-600 hover:bg-red-50">
                    <LogOut size={16} /> Logout
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Link to="/login" className="rounded-lg border border-gray-300 py-2.5 text-center text-gray-700">Login</Link>
                  <Link to="/register" className="rounded-lg bg-brand-600 py-2.5 text-center text-white">Sign up</Link>
                </div>
              )}
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
}
