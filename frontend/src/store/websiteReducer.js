import siteAuthReducer from './slices/website/siteAuthSlice';
import cartReducer from './slices/website/cartSlice';
import bannerReducer from './slices/website/bannerSlice';
import catalogReducer from './slices/website/catalogSlice';
import cmsReducer from './slices/website/cmsSlice';
import myOrderReducer from './slices/website/myOrderSlice';
import checkoutReducer from './slices/website/checkoutSlice';
import chatReducer from './slices/website/chatSlice';

// Website reducers
const websiteReducer = {
  auth: siteAuthReducer,     // website auth  → state.auth
  cart: cartReducer,         // cart          → state.cart
  banners: bannerReducer,    // banners       → state.banners
  catalog: catalogReducer,   // products, categories → state.catalog
  cms: cmsReducer,           // shop, about, testimonials → state.cms
  myOrders: myOrderReducer,  // customer orders → state.myOrders
  checkout: checkoutReducer, // payment options → state.checkout
  chat: chatReducer,         // AI assistant  → state.chat
};

export default websiteReducer;
