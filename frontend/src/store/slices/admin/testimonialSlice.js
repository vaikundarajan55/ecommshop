import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import adminApi from '../../../services/adminApi';
import { errorMessage, formError } from '../../../utils/notify';
import { clean } from '../../../utils/validators';

// Admin > Testimonials (all of them, active or not)

const toFormData = (t) => {
  const fd = new FormData();
  fd.append('name', clean(t.name));
  fd.append('designation', clean(t.designation));
  ['message', 'rating', 'sort_order', 'status'].forEach((k) => fd.append(k, t[k] ?? ''));
  if (t.image) fd.append('image', t.image);
  return fd;
};

export const fetchAllTestimonials = createAsyncThunk('testimonials/fetchAll', async (_, { rejectWithValue }) => {
  try {
    const { data } = await adminApi.get('/cms/testimonials/all');
    return data.data;
  } catch (err) {
    return rejectWithValue(errorMessage(err, 'Could not load testimonials'));
  }
});

// Create / update reject with { message, errors }, same as Category
export const createTestimonial = createAsyncThunk('testimonials/create', async (t, { dispatch, rejectWithValue }) => {
  try {
    const { data } = await adminApi.post('/cms/testimonials', toFormData(t));
    dispatch(fetchAllTestimonials());
    return data;
  } catch (err) {
    return rejectWithValue(formError(err));
  }
});

export const updateTestimonial = createAsyncThunk('testimonials/update', async (t, { dispatch, rejectWithValue }) => {
  try {
    const { data } = await adminApi.put(`/cms/testimonials/${t.testimonial_id}`, toFormData(t));
    dispatch(fetchAllTestimonials());
    return data;
  } catch (err) {
    return rejectWithValue(formError(err));
  }
});

export const deleteTestimonial = createAsyncThunk('testimonials/delete', async (id, { rejectWithValue }) => {
  try {
    await adminApi.delete(`/cms/testimonials/${id}`);
    return id;
  } catch (err) {
    return rejectWithValue(errorMessage(err, 'Delete failed'));
  }
});

const testimonialSlice = createSlice({
  name: 'testimonials',
  initialState: {
    items: [],
    loading: false,
    saving: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllTestimonials.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchAllTestimonials.fulfilled, (state, action) => { state.loading = false; state.items = action.payload; })
      .addCase(fetchAllTestimonials.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

      .addCase(deleteTestimonial.fulfilled, (state, action) => {
        state.items = state.items.filter((t) => t.testimonial_id !== action.payload);
      });

    [createTestimonial, updateTestimonial].forEach((thunk) => {
      builder
        .addCase(thunk.pending, (state) => { state.saving = true; state.error = null; })
        .addCase(thunk.fulfilled, (state) => { state.saving = false; })
        .addCase(thunk.rejected, (state, action) => { state.saving = false; state.error = action.payload?.message; });
    });
  },
});

export default testimonialSlice.reducer;
