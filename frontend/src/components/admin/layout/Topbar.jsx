import { useState, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { LogOut, Menu, ChevronDown, User } from 'lucide-react';
import { logout } from '../../../store/slices/admin/adminAuthSlice';
import { notify } from '../../../utils/notify';
import { useAdminUI } from '../../../context/AdminUIContext';

export default function Topbar() {
  const user = useSelector((s) => s.adminAuth.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { toggleMobile } = useAdminUI();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const onClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const handleLogout = () => {
    dispatch(logout());
    notify.logout('You have been logged out');
    navigate('/admin/login');
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 animate-fadeInDown items-center justify-between border-b border-gray-200 bg-white/90 px-4 backdrop-blur-sm sm:px-6">
      {/* animated gradient accent line */}
      <span className="pointer-events-none absolute inset-x-0 bottom-0 h-0.5 animate-gradient bg-gradient-to-r from-primary-600 via-violet-500 to-brand-500 bg-[length:200%_200%]" />
      <div className="flex items-center gap-3">
        <button
          onClick={toggleMobile}
          className="flex h-9 w-9 items-center justify-center rounded-md text-gray-500 transition-all duration-200 hover:bg-gray-100 hover:text-primary-600 active:scale-90 md:hidden"
        >
          <Menu size={20} />
        </button>
        <h1 className="text-base font-semibold text-gray-700 sm:text-lg">
          Welcome, <span className="text-primary-600">{user?.name || 'Admin'}</span>
        </h1>
      </div>

      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setMenuOpen((o) => !o)}
          className="flex items-center gap-2 rounded-full border border-gray-200 py-1 pl-1 pr-2 text-sm text-gray-600 transition-all duration-200 hover:bg-gray-50 hover:shadow-sm"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-100 text-primary-700">
            <User size={14} />
          </span>
          <ChevronDown size={14} className={`transition-transform duration-200 ${menuOpen ? 'rotate-180' : ''}`} />
        </button>

        <div
          className={`absolute right-0 mt-2 w-44 origin-top-right rounded-lg border border-gray-100 bg-white py-1 shadow-lg transition-all duration-200 ${
            menuOpen ? 'scale-100 opacity-100' : 'pointer-events-none scale-95 opacity-0'
          }`}
        >
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-600 transition-colors hover:bg-gray-50 hover:text-red-600"
          >
            <LogOut size={16} /> Logout
          </button>
        </div>
      </div>
    </header>
  );
}
