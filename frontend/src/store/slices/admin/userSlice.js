import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import adminApi from '../../../services/adminApi';
import { errorMessage } from '../../../utils/notify';

// Admin > User List. Called without filters it reuses the last search.

export const fetchUsers = createAsyncThunk('users/fetchAll', async (filters, { getState, rejectWithValue }) => {
  try {
    const { data } = await adminApi.get('/users', { params: filters ?? getState().users.filters });
    return data.data;
  } catch (err) {
    return rejectWithValue(errorMessage(err, 'Could not load users'));
  }
});

// status: 'active' | 'blocked'
export const updateUserStatus = createAsyncThunk('users/updateStatus', async ({ id, status }, { rejectWithValue }) => {
  try {
    await adminApi.put(`/users/${id}/status`, { status });
    return { id, status };
  } catch (err) {
    return rejectWithValue(errorMessage(err, 'Could not update user'));
  }
});

const userSlice = createSlice({
  name: 'users',
  initialState: {
    items: [],
    filters: { role: '', status: '', search: '' },
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsers.pending, (state, action) => {
        state.loading = true;
        state.error = null;
        if (action.meta.arg) state.filters = action.meta.arg;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => { state.loading = false; state.items = action.payload; })
      .addCase(fetchUsers.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

      .addCase(updateUserStatus.fulfilled, (state, action) => {
        const user = state.items.find((u) => u.id === action.payload.id);
        if (user) user.status = action.payload.status;
      });
  },
});

export default userSlice.reducer;
