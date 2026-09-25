import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import adminApi from '../../../services/adminApi';
import { errorMessage } from '../../../utils/notify';

// Admin > Enquiry: messages sent from the website Contact us page

export const fetchContacts = createAsyncThunk('contacts/fetchAll', async (_, { rejectWithValue }) => {
  try {
    const { data } = await adminApi.get('/cms/contact');
    return data.data;
  } catch (err) {
    return rejectWithValue(errorMessage(err, 'Could not load enquiries'));
  }
});

// status: 'new' | 'read' | 'replied'
export const updateContactStatus = createAsyncThunk('contacts/updateStatus', async ({ id, status }, { rejectWithValue }) => {
  try {
    await adminApi.put(`/cms/contact/${id}/status`, { status });
    return { id, status };
  } catch (err) {
    return rejectWithValue(errorMessage(err, 'Could not update'));
  }
});

export const deleteContact = createAsyncThunk('contacts/delete', async (id, { rejectWithValue }) => {
  try {
    await adminApi.delete(`/cms/contact/${id}`);
    return id;
  } catch (err) {
    return rejectWithValue(errorMessage(err, 'Delete failed'));
  }
});

const contactSlice = createSlice({
  name: 'contacts',
  initialState: {
    items: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchContacts.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchContacts.fulfilled, (state, action) => { state.loading = false; state.items = action.payload; })
      .addCase(fetchContacts.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

      .addCase(updateContactStatus.fulfilled, (state, action) => {
        const msg = state.items.find((m) => m.id === action.payload.id);
        if (msg) msg.status = action.payload.status;
      })
      .addCase(deleteContact.fulfilled, (state, action) => {
        state.items = state.items.filter((m) => m.id !== action.payload);
      });
  },
});

export default contactSlice.reducer;
