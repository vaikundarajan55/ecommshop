import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import adminApi from '../../../services/adminApi';
import { errorMessage, formError } from '../../../utils/notify';
import { clean } from '../../../utils/validators';

// Admin > About Page. One record: only fetched and updated.

export const ABOUT_FIELDS = ['title', 'subtitle', 'heading', 'content', 'mission', 'vision'];
const SINGLE_LINE = ['title', 'subtitle', 'heading']; // the rest keep their line breaks

const toFormData = (about) => {
  const fd = new FormData();
  ABOUT_FIELDS.forEach((k) => fd.append(k, SINGLE_LINE.includes(k) ? clean(about[k]) : about[k] ?? ''));
  if (about.image) fd.append('image', about.image);
  return fd;
};

export const fetchAbout = createAsyncThunk('about/fetch', async (_, { rejectWithValue }) => {
  try {
    const { data } = await adminApi.get('/cms/about');
    return data.data;
  } catch (err) {
    return rejectWithValue(errorMessage(err, 'Could not load About page'));
  }
});

// Rejects with { message, errors }, same as Category
export const updateAbout = createAsyncThunk('about/update', async (about, { rejectWithValue }) => {
  try {
    const { data } = await adminApi.put('/cms/about', toFormData(about));
    return data.data;
  } catch (err) {
    return rejectWithValue(formError(err, 'Update failed'));
  }
});

const aboutSlice = createSlice({
  name: 'about',
  initialState: {
    data: null,
    loading: false,
    saving: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAbout.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchAbout.fulfilled, (state, action) => { state.loading = false; state.data = action.payload; })
      .addCase(fetchAbout.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

      .addCase(updateAbout.pending, (state) => { state.saving = true; state.error = null; })
      .addCase(updateAbout.fulfilled, (state, action) => { state.saving = false; state.data = action.payload; })
      .addCase(updateAbout.rejected, (state, action) => { state.saving = false; state.error = action.payload?.message; });
  },
});

export default aboutSlice.reducer;
