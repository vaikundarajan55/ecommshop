import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import siteApi from '../../../services/siteApi';
import { errorMessage } from '../../../utils/notify';
import { logout } from './siteAuthSlice';

// The signed-in customer's orders (Dashboard, My orders, order details popup).

export const fetchMyOrders = createAsyncThunk('myOrders/fetchAll', async (_, { rejectWithValue }) => {
  try {
    const { data } = await siteApi.get('/orders/my');
    return data.data;
  } catch (err) {
    return rejectWithValue(errorMessage(err, 'Could not load your orders'));
  }
});

export const fetchMyOrderById = createAsyncThunk('myOrders/fetchOne', async (id, { rejectWithValue }) => {
  try {
    const { data } = await siteApi.get(`/orders/${id}`);
    return data.data;
  } catch (err) {
    return rejectWithValue(errorMessage(err, 'Could not load order'));
  }
});

const myOrderSlice = createSlice({
  name: 'myOrders',
  initialState: {
    items: null,   // null = loading
    details: {},   // order details by id
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchMyOrders.fulfilled, (state, action) => { state.items = action.payload; state.error = null; })
      .addCase(fetchMyOrders.rejected, (state, action) => { state.items = state.items || []; state.error = action.payload; })

      .addCase(fetchMyOrderById.fulfilled, (state, action) => { state.details[action.payload.id] = action.payload; })

      // Another customer may sign in next - drop the previous one's orders
      .addCase(logout, (state) => { state.items = null; state.details = {}; state.error = null; });
  },
});

export default myOrderSlice.reducer;
