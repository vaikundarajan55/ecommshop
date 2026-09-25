import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import adminApi from '../../../services/adminApi';
import { errorMessage } from '../../../utils/notify';

// Admin > Visitors: one row per IP (`ips`), every page view (`views`), and one IP's `history`

export const fetchVisitors = createAsyncThunk('visitors/fetchAll', async (_, { rejectWithValue }) => {
  try {
    const [{ data }, { data: recent }] = await Promise.all([adminApi.get('/visitors'), adminApi.get('/visitors/recent')]);
    return {
      ips: data.data.map((r) => ({ ...r, id: r.ip })),
      stats: data.stats || {},
      serverIp: data.server_ip || '',
      views: recent.data,
    };
  } catch (err) {
    return rejectWithValue(errorMessage(err, 'Could not load visitors'));
  }
});

export const fetchVisitorHistory = createAsyncThunk('visitors/fetchHistory', async (ip, { rejectWithValue }) => {
  try {
    const { data } = await adminApi.get(`/visitors/${encodeURIComponent(ip)}`);
    return data.data;
  } catch (err) {
    return rejectWithValue(errorMessage(err, 'Could not load history'));
  }
});

// Deletes change the stats too, so everything is reloaded
export const deleteVisitor = createAsyncThunk('visitors/delete', async (ip, { dispatch, rejectWithValue }) => {
  try {
    await adminApi.delete(`/visitors/${encodeURIComponent(ip)}`);
    dispatch(fetchVisitors());
    return ip;
  } catch (err) {
    return rejectWithValue(errorMessage(err, 'Delete failed'));
  }
});

export const clearVisitors = createAsyncThunk('visitors/clear', async (_, { dispatch, rejectWithValue }) => {
  try {
    await adminApi.delete('/visitors');
    dispatch(fetchVisitors());
    return true;
  } catch (err) {
    return rejectWithValue(errorMessage(err, 'Could not clear visitor log'));
  }
});

const visitorSlice = createSlice({
  name: 'visitors',
  initialState: {
    ips: [],
    views: [],
    stats: {},
    serverIp: '',
    history: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchVisitors.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchVisitors.fulfilled, (state, action) => { state.loading = false; Object.assign(state, action.payload); })
      .addCase(fetchVisitors.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

      .addCase(fetchVisitorHistory.pending, (state) => { state.history = []; })
      .addCase(fetchVisitorHistory.fulfilled, (state, action) => { state.history = action.payload; })

      .addCase(deleteVisitor.fulfilled, (state, action) => {
        state.ips = state.ips.filter((r) => r.ip !== action.payload);
        state.views = state.views.filter((r) => r.ip !== action.payload);
      })
      .addCase(clearVisitors.fulfilled, (state) => { state.ips = []; state.views = []; state.history = []; });
  },
});

export default visitorSlice.reducer;
