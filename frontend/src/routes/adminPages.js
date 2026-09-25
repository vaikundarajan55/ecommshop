import { lazy } from 'react';

// ── Admin pages ─────────────────────────────────────────────────────────────
export const AdminLogin = lazy(() => import('../pages/admin/Login'));
export const AdminForgotPassword = lazy(() => import('../pages/admin/ForgotPassword'));
export const AdminResetPassword = lazy(() => import('../pages/admin/ResetPassword'));
export const AdminDashboard = lazy(() => import('../pages/admin/Dashboard'));
export const Category = lazy(() => import('../pages/admin/Category'));
export const Subcategory = lazy(() => import('../pages/admin/Subcategory'));
export const Product = lazy(() => import('../pages/admin/Product'));
export const OrderList = lazy(() => import('../pages/admin/OrderList'));
export const Report = lazy(() => import('../pages/admin/Report'));
export const UserList = lazy(() => import('../pages/admin/UserList'));
export const AdminChangePassword = lazy(() => import('../pages/admin/ChangePassword'));
export const PaymentMethods = lazy(() => import('../pages/admin/PaymentMethods'));
export const Banners = lazy(() => import('../pages/admin/Banners'));
export const Testimonials = lazy(() => import('../pages/admin/Testimonials'));
export const AboutPage = lazy(() => import('../pages/admin/AboutPage'));
export const ContactMessages = lazy(() => import('../pages/admin/ContactMessages'));
export const ShopSettings = lazy(() => import('../pages/admin/ShopSettings'));
export const Visitors = lazy(() => import('../pages/admin/Visitors'));
