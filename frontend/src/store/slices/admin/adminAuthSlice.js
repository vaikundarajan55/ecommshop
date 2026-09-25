import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  user: JSON.parse(localStorage.getItem('admin_user') || 'null'),
  token: localStorage.getItem('admin_token') || null,
};

const adminAuthSlice = createSlice({
  name: 'adminAuth',
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      localStorage.setItem('admin_user', JSON.stringify(action.payload.user));
      localStorage.setItem('admin_token', action.payload.token);
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      localStorage.removeItem('admin_user');
      localStorage.removeItem('admin_token');
    },
  },
});

export const { setCredentials, logout } = adminAuthSlice.actions;
export default adminAuthSlice.reducer;
