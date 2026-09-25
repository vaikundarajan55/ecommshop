import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import siteApi from '../../../services/siteApi';
import { errorMessage } from '../../../utils/notify';

// Payment page: gateway config, payment options, and the order / payment steps.

// { razorpay, demo, keyId, testMode }
export const fetchPaymentConfig = createAsyncThunk('checkout/fetchConfig', async (_, { rejectWithValue }) => {
  try {
    const { data } = await siteApi.get('/payments/config');
    return data.data;
  } catch (err) {
    return rejectWithValue(errorMessage(err));
  }
});

export const fetchPaymentMethods = createAsyncThunk('checkout/fetchMethods', async (_, { rejectWithValue }) => {
  try {
    const { data } = await siteApi.get('/payment-methods');
    return data.data;
  } catch (err) {
    return rejectWithValue(errorMessage(err, 'Could not load payment options'));
  }
});

// Cash on Delivery: the order is placed straight away
export const placeOrder = createAsyncThunk('checkout/placeOrder', async (body, { rejectWithValue }) => {
  try {
    const { data } = await siteApi.post('/orders', body);
    return data.data;
  } catch (err) {
    return rejectWithValue(errorMessage(err, 'Could not place your order'));
  }
});

// Online payment step 1: Razorpay order for the popup
export const createRazorpayOrder = createAsyncThunk('checkout/razorpayOrder', async (body, { rejectWithValue }) => {
  try {
    const { data } = await siteApi.post('/payments/razorpay/order', body);
    return data.data;
  } catch (err) {
    return rejectWithValue(errorMessage(err, 'Could not start the payment'));
  }
});

// Online payment step 2: verify the payment - the order is created here
export const verifyRazorpayPayment = createAsyncThunk('checkout/razorpayVerify', async (body, { rejectWithValue }) => {
  try {
    const { data } = await siteApi.post('/payments/razorpay/verify', body);
    return data.data;
  } catch (err) {
    return rejectWithValue(errorMessage(err, 'We could not confirm your payment'));
  }
});

// A failed attempt inside the popup - only recorded, the popup stays open for a retry
export const reportPaymentFailure = createAsyncThunk('checkout/razorpayFailed', async (body, { rejectWithValue }) => {
  try {
    await siteApi.post('/payments/razorpay/failed', body);
    return true;
  } catch (err) {
    return rejectWithValue(errorMessage(err));
  }
});

// Built-in demo gateway; resolves with the same shape as Razorpay's success response
export const payDemo = createAsyncThunk('checkout/demoPay', async (body, { rejectWithValue }) => {
  try {
    const { data } = await siteApi.post('/payments/demo/pay', body);
    return data.data;
  } catch (err) {
    return rejectWithValue(errorMessage(err, 'Payment failed'));
  }
});

const checkoutSlice = createSlice({
  name: 'checkout',
  initialState: {
    gateway: null,   // null = loading
    methods: null,   // null = loading
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchPaymentConfig.fulfilled, (state, action) => { state.gateway = action.payload; })
      .addCase(fetchPaymentConfig.rejected, (state) => { state.gateway = { razorpay: false }; })

      .addCase(fetchPaymentMethods.pending, (state) => { state.methods = null; })
      .addCase(fetchPaymentMethods.fulfilled, (state, action) => { state.methods = action.payload; })
      .addCase(fetchPaymentMethods.rejected, (state) => { state.methods = []; });
  },
});

export default checkoutSlice.reducer;
