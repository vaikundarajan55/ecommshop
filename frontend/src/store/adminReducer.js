import adminAuthReducer from './slices/admin/adminAuthSlice';
import categoryReducer from './slices/admin/categorySlice';
import subcategoryReducer from './slices/admin/subcategorySlice';
import productReducer from './slices/admin/productSlice';
import testimonialReducer from './slices/admin/testimonialSlice';
import contactReducer from './slices/admin/contactSlice';
import paymentMethodReducer from './slices/admin/paymentMethodSlice';
import userReducer from './slices/admin/userSlice';
import orderReducer from './slices/admin/orderSlice';
import aboutReducer from './slices/admin/aboutSlice';
import shopSettingsReducer from './slices/admin/shopSettingsSlice';
import visitorReducer from './slices/admin/visitorSlice';
import dashboardReducer from './slices/admin/dashboardSlice';
import reportReducer from './slices/admin/reportSlice';

// Admin reducers
const adminReducer = {
  adminAuth: adminAuthReducer,           // → state.adminAuth
  categories: categoryReducer,           // → state.categories
  subcategories: subcategoryReducer,     // → state.subcategories
  products: productReducer,              // → state.products
  testimonials: testimonialReducer,      // → state.testimonials
  contacts: contactReducer,              // → state.contacts
  paymentMethods: paymentMethodReducer,  // → state.paymentMethods
  users: userReducer,                    // → state.users
  orders: orderReducer,                  // → state.orders
  about: aboutReducer,                   // → state.about
  shopSettings: shopSettingsReducer,     // → state.shopSettings
  visitors: visitorReducer,              // → state.visitors
  dashboard: dashboardReducer,           // → state.dashboard
  report: reportReducer,                 // → state.report
};

export default adminReducer;
