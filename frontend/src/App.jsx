import { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// ── Layouts & guards (eager) ────────────────────────────────────────────────
import SiteLayout from './components/website/layout/SiteLayout';
import ProtectedRoute from './components/website/common/ProtectedRoute';
import AdminLayout from './components/admin/layout/AdminLayout';
import AdminProtectedRoute from './components/admin/common/ProtectedRoute';

// ── Website pages (lazy) ────────────────────────────────────────────────────
import {
  Home, About, Contact, ProductList, ProductView, Cart, Checkout, Payment,
  Success, Failure, Login, Register, Dashboard, MyOrders, ChatAssistant,
  Profile, ChangePassword, Forgot, ForgotChange,
} from './routes/websitePages';

// ── Admin pages (lazy) ──────────────────────────────────────────────────────
import {
  AdminLogin, AdminForgotPassword, AdminResetPassword, AdminDashboard,
  Category, Subcategory, Product, OrderList, Report, UserList,
  AdminChangePassword, PaymentMethods, Banners, Testimonials, AboutPage,
  ContactMessages, ShopSettings, Visitors,
} from './routes/adminPages';

const PageLoader = () => (
  <div style={{ padding: '3rem', textAlign: 'center' }}>Loading...</div>
);

export default function App() {
  return (
    <Suspense fallback={<PageLoader />}>
    <Routes>

      {/* ── Website routes (/  →  /...) ─────────────────────────────────── */}
      <Route element={<SiteLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/products" element={<ProductList />} />
        <Route path="/products/:id" element={<ProductView />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
        <Route path="/payment" element={<ProtectedRoute><Payment /></ProtectedRoute>} />
        <Route path="/order-success" element={<ProtectedRoute><Success /></ProtectedRoute>} />
        <Route path="/order-failure" element={<Failure />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<Forgot />} />
        <Route path="/forgot-change-password" element={<ForgotChange />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/my-orders" element={<ProtectedRoute><MyOrders /></ProtectedRoute>} />
        <Route path="/assistant" element={<ProtectedRoute><ChatAssistant /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/change-password" element={<ProtectedRoute><ChangePassword /></ProtectedRoute>} />
      </Route>

      {/* ── Admin routes (/admin/login  +  /admin/...) ──────────────────── */}
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin/forgot-password" element={<AdminForgotPassword />} />
      <Route path="/admin/reset-password" element={<AdminResetPassword />} />

      <Route
        path="/admin"
        element={
          <AdminProtectedRoute>
            <AdminLayout />
          </AdminProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="categories" element={<Category />} />
        <Route path="subcategories" element={<Subcategory />} />
        <Route path="products" element={<Product />} />
        <Route path="orders" element={<OrderList />} />
        <Route path="orders/report" element={<Report />} />
        <Route path="users" element={<UserList />} />
        <Route path="payment-methods" element={<PaymentMethods />} />
        <Route path="banners" element={<Banners />} />
        <Route path="testimonials" element={<Testimonials />} />
        <Route path="about-page" element={<AboutPage />} />
        <Route path="contact-messages" element={<ContactMessages />} />
        <Route path="shop-settings" element={<ShopSettings />} />
        <Route path="visitors" element={<Visitors />} />
        <Route path="change-password" element={<AdminChangePassword />} />
      </Route>

      {/* Catch-all → website home */}
      <Route path="*" element={<Navigate to="/" replace />} />

    </Routes>
    </Suspense>
  );
}
