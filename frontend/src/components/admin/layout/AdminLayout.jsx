import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import Footer from './Footer';
import { AdminUIProvider } from '../../../context/AdminUIContext';
import useSeo from '../../../hooks/useSeo';

const TITLES = {
  dashboard: 'Dashboard', categories: 'Categories', subcategories: 'Subcategories', products: 'Products',
  orders: 'Orders', report: 'Order Report', users: 'Users', 'payment-methods': 'Payment Methods', banners: 'Banners', testimonials: 'Testimonials', 'about-page': 'About Us', 'contact-messages': 'Enquiry', 'shop-settings': 'Contact Us', 'change-password': 'Change Password',
};

export default function AdminLayout() {
  const location = useLocation();
  // Admin screens must never appear in search results
  const section = location.pathname.split('/').filter(Boolean).pop();
  useSeo({ title: `Admin - ${TITLES[section] || 'Panel'}`, noindex: true });

  return (
    <AdminUIProvider>
      <div className="flex min-h-screen bg-gradient-to-br from-slate-100 via-indigo-50/60 to-violet-100/60">
        <Sidebar />
        <div className="flex min-h-screen flex-1 flex-col">
          <Topbar />
          <main className="flex-1 p-4 sm:p-6">
            <div key={location.pathname} className="animate-fadeInUp">
              <Outlet />
            </div>
          </main>
          <Footer />
        </div>
      </div>
    </AdminUIProvider>
  );
}
