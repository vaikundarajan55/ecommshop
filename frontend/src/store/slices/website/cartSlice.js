import { createSlice } from '@reduxjs/toolkit';

const savedCart = JSON.parse(localStorage.getItem('cart_items') || '[]');
const persist = (items) => localStorage.setItem('cart_items', JSON.stringify(items));

const cartSlice = createSlice({
  name: 'cart',
  initialState: { items: savedCart },
  reducers: {
    addToCart: (state, action) => {
      const existing = state.items.find((i) => i.productId === action.payload.productId);
      if (existing) existing.quantity += action.payload.quantity || 1;
      else state.items.push({ ...action.payload, quantity: action.payload.quantity || 1 });
      persist(state.items);
    },
    updateQuantity: (state, action) => {
      const item = state.items.find((i) => i.productId === action.payload.productId);
      if (item) item.quantity = Math.max(1, action.payload.quantity);
      persist(state.items);
    },
    removeFromCart: (state, action) => {
      state.items = state.items.filter((i) => i.productId !== action.payload);
      persist(state.items);
    },
    clearCart: (state) => {
      state.items = [];
      persist(state.items);
    },
  },
});

export const { addToCart, updateQuantity, removeFromCart, clearCart } = cartSlice.actions;
export default cartSlice.reducer;
