import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import adminApi from '../../../services/adminApi';
import { errorMessage } from '../../../utils/notify';

// Admin > Dashboard summary (counts, charts, today's orders)

export const fetchDashboardSummary = createAsyncThunk('dashboard/fetchSummary', async (_, { rejectWithValue }) => {
  try {
    const { data } = await adminApi.get('/dashboard/summary');
    return data.data;
  } catch (err) {
    return rejectWithValue(errorMessage(err, 'Could not load dashboard'));
  }
});

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState: {
    data: null,
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboardSummary.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchDashboardSummary.fulfilled, (state, action) => { state.loading = false; state.data = action.payload; })
      .addCase(fetchDashboardSummary.rejected, (state, action) => { state.loading = false; state.error = action.payload; });
  },
});

export default dashboardSlice.reducer;
