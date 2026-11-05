import { Routes, Route, Navigate } from 'react-router-dom';

import SiteLayout from '../components/website/layout/SiteLayout';
import ProtectedRoute from '../components/website/common/ProtectedRoute';

import {
  Home, About, Contact, ProductList, ProductView, Cart, Checkout, Payment,
  Success, Failure, Login, Register, Dashboard, MyOrders, ChatAssistant,
  Profile, ChangePassword, Forgot, ForgotChange,
} from './websitePages';

// Website routes — mounted at "/*" in App.jsx
export default function WebsiteRoutes() {
  return (
    <Routes>
      <Route element={<SiteLayout />}>
        <Route index element={<Home />} />
        <Route path="about" element={<About />} />
        <Route path="contact" element={<Contact />} />
        <Route path="products" element={<ProductList />} />
        <Route path="products/:id" element={<ProductView />} />
        <Route path="cart" element={<Cart />} />
        <Route path="checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
        <Route path="payment" element={<ProtectedRoute><Payment /></ProtectedRoute>} />
        <Route path="order-success" element={<ProtectedRoute><Success /></ProtectedRoute>} />
        <Route path="order-failure" element={<Failure />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="forgot-password" element={<Forgot />} />
        <Route path="forgot-change-password" element={<ForgotChange />} />
        <Route path="dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="my-orders" element={<ProtectedRoute><MyOrders /></ProtectedRoute>} />
        <Route path="assistant" element={<ProtectedRoute><ChatAssistant /></ProtectedRoute>} />
        <Route path="profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="change-password" element={<ProtectedRoute><ChangePassword /></ProtectedRoute>} />
      </Route>

      {/* Catch-all → website home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
