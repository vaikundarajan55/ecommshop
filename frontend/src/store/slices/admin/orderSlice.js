import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import adminApi from '../../../services/adminApi';
import { errorMessage } from '../../../utils/notify';

// Admin > Order List. Called without filters it reuses the last filter (used by the live socket reloads).

export const fetchOrders = createAsyncThunk('orders/fetchAll', async (filters, { getState, rejectWithValue }) => {
  try {
    const { data } = await adminApi.get('/orders', { params: filters ?? getState().orders.filters });
    return data.data;
  } catch (err) {
    return rejectWithValue(errorMessage(err, 'Could not load orders'));
  }
});

// Full order with its tracking history
export const fetchOrderById = createAsyncThunk('orders/fetchOne', async (id, { rejectWithValue }) => {
  try {
    const { data } = await adminApi.get(`/orders/${id}`);
    return data.data;
  } catch (err) {
    return rejectWithValue(errorMessage(err, 'Could not load order'));
  }
});

export const updateOrderStatus = createAsyncThunk('orders/updateStatus', async ({ id, status, note }, { dispatch, rejectWithValue }) => {
  try {
    const { data } = await adminApi.put(`/orders/${id}/status`, { status, note });
    dispatch(fetchOrders());
    return data;
  } catch (err) {
    return rejectWithValue(errorMessage(err, 'Failed to update status'));
  }
});

const orderSlice = createSlice({
  name: 'orders',
  initialState: {
    items: [],
    filters: { status: '', dateFrom: '', dateTo: '', search: '' },
    loading: false,
    saving: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchOrders.pending, (state, action) => {
        state.loading = true;
        state.error = null;
        if (action.meta.arg) state.filters = action.meta.arg;
      })
      .addCase(fetchOrders.fulfilled, (state, action) => { state.loading = false; state.items = action.payload; })
      .addCase(fetchOrders.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

      .addCase(updateOrderStatus.pending, (state) => { state.saving = true; state.error = null; })
      .addCase(updateOrderStatus.fulfilled, (state) => { state.saving = false; })
      .addCase(updateOrderStatus.rejected, (state, action) => { state.saving = false; state.error = action.payload; });
  },
});

export default orderSlice.reducer;
