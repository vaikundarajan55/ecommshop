import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import adminApi from '../../../services/adminApi';
import { errorMessage } from '../../../utils/notify';

// Admin > Order Report. filters: { dateFrom, dateTo, status, groupBy }

export const fetchOrderReport = createAsyncThunk('report/fetch', async (filters, { rejectWithValue }) => {
  try {
    const { data } = await adminApi.get('/orders/reports/summary', { params: filters });
    return data.data;
  } catch (err) {
    return rejectWithValue(errorMessage(err, 'Could not run report'));
  }
});

const reportSlice = createSlice({
  name: 'report',
  initialState: {
    rows: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchOrderReport.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchOrderReport.fulfilled, (state, action) => { state.loading = false; state.rows = action.payload; })
      .addCase(fetchOrderReport.rejected, (state, action) => { state.loading = false; state.error = action.payload; });
  },
});

export default reportSlice.reducer;
