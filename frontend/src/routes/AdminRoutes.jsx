import { Routes, Route, Navigate } from 'react-router-dom';

import AdminLayout from '../components/admin/layout/AdminLayout';
import AdminProtectedRoute from '../components/admin/common/ProtectedRoute';

import {
  AdminLogin, AdminForgotPassword, AdminResetPassword, AdminDashboard,
  Category, Subcategory, Product, OrderList, Report, UserList,
  AdminChangePassword, PaymentMethods, Banners, Testimonials, AboutPage,
  ContactMessages, ShopSettings, Visitors,
} from './adminPages';

// Admin routes — mounted at "/admin/*" in App.jsx (paths below are relative to /admin)
export default function AdminRoutes() {
  return (
    <Routes>
      {/* Public admin pages */}
      <Route path="login" element={<AdminLogin />} />
      <Route path="forgot-password" element={<AdminForgotPassword />} />
      <Route path="reset-password" element={<AdminResetPassword />} />

      {/* Protected admin pages */}
      <Route
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

      {/* Unknown /admin/* path → website home (same as before) */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
