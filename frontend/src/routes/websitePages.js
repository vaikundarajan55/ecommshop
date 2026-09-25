import { lazy } from 'react';

// ── Website pages ───────────────────────────────────────────────────────────
export const Home = lazy(() => import('../pages/website/Home'));
export const About = lazy(() => import('../pages/website/About'));
export const Contact = lazy(() => import('../pages/website/Contact'));
export const ProductList = lazy(() => import('../pages/website/ProductList'));
export const ProductView = lazy(() => import('../pages/website/ProductView'));
export const Cart = lazy(() => import('../pages/website/Cart'));
export const Checkout = lazy(() => import('../pages/website/Checkout'));
export const Payment = lazy(() => import('../pages/website/Payment'));
export const Success = lazy(() => import('../pages/website/Success'));
export const Failure = lazy(() => import('../pages/website/Failure'));
export const Login = lazy(() => import('../pages/website/Login'));
export const Register = lazy(() => import('../pages/website/Register'));
export const Dashboard = lazy(() => import('../pages/website/Dashboard'));
export const MyOrders = lazy(() => import('../pages/website/MyOrders'));
export const ChatAssistant = lazy(() => import('../pages/website/ChatAssistant'));
export const Profile = lazy(() => import('../pages/website/Profile'));
export const ChangePassword = lazy(() => import('../pages/website/ChangePassword'));
export const Forgot = lazy(() => import('../pages/website/Forgot'));
export const ForgotChange = lazy(() => import('../pages/website/ForgotChange'));
