import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import adminApi from '../../../services/adminApi';
import { errorMessage } from '../../../utils/notify';

// Admin > Payment Methods. The methods are fixed (no add / delete) - only edited, toggled or made default.

export const fetchAllPaymentMethods = createAsyncThunk('paymentMethods/fetchAll', async (_, { rejectWithValue }) => {
  try {
    const { data } = await adminApi.get('/payment-methods/all');
    return data.data;
  } catch (err) {
    return rejectWithValue(errorMessage(err, 'Could not load payment methods'));
  }
});

// arg: { id, name, description, sort_order, is_active }
export const updatePaymentMethod = createAsyncThunk('paymentMethods/update', async ({ id, ...body }, { dispatch, rejectWithValue }) => {
  try {
    const { data } = await adminApi.put(`/payment-methods/${id}`, body);
    dispatch(fetchAllPaymentMethods());
    return data;
  } catch (err) {
    return rejectWithValue(errorMessage(err, 'Could not update'));
  }
});

// Resolves with the API message (e.g. "UPI is now the default")
export const setDefaultPaymentMethod = createAsyncThunk('paymentMethods/setDefault', async (id, { dispatch, rejectWithValue }) => {
  try {
    const { data } = await adminApi.put(`/payment-methods/${id}/default`);
    dispatch(fetchAllPaymentMethods());
    return data.message;
  } catch (err) {
    return rejectWithValue(errorMessage(err, 'Could not set default'));
  }
});

const paymentMethodSlice = createSlice({
  name: 'paymentMethods',
  initialState: {
    items: [],
    loading: false,
    saving: false,
    busyId: null,   // row whose toggle / default button is working
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllPaymentMethods.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchAllPaymentMethods.fulfilled, (state, action) => { state.loading = false; state.items = action.payload; })
      .addCase(fetchAllPaymentMethods.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

      .addCase(setDefaultPaymentMethod.pending, (state, action) => { state.busyId = action.meta.arg; })
      .addCase(setDefaultPaymentMethod.fulfilled, (state) => { state.busyId = null; })
      .addCase(setDefaultPaymentMethod.rejected, (state, action) => { state.busyId = null; state.error = action.payload; })

      .addCase(updatePaymentMethod.pending, (state, action) => { state.saving = true; state.busyId = action.meta.arg.id; state.error = null; })
      .addCase(updatePaymentMethod.fulfilled, (state) => { state.saving = false; state.busyId = null; })
      .addCase(updatePaymentMethod.rejected, (state, action) => { state.saving = false; state.busyId = null; state.error = action.payload; });
  },
});

export default paymentMethodSlice.reducer;
