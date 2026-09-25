import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import adminApi from '../../../services/adminApi';
import siteApi from '../../../services/siteApi';
import { errorMessage } from '../../../utils/notify';

// Home page slides. `active` feeds the website slider, `items` feeds Admin > Banners.

// Banner fields -> multipart body (the image is optional on update)
const toFormData = (banner) => {
  const fd = new FormData();
  ['title', 'subtitle', 'button_text', 'button_link', 'sort_order', 'status'].forEach((k) => fd.append(k, banner[k] ?? ''));
  if (banner.image) fd.append('image', banner.image);
  return fd;
};

// ---------------- Website ----------------
export const fetchActiveBanners = createAsyncThunk('banners/fetchActive', async (_, { rejectWithValue }) => {
  try {
    const { data } = await siteApi.get('/cms/banners');
    return data.data;
  } catch (err) {
    return rejectWithValue(errorMessage(err, 'Could not load banners'));
  }
});

// ---------------- Admin ----------------
export const fetchAllBanners = createAsyncThunk('banners/fetchAll', async (_, { rejectWithValue }) => {
  try {
    const { data } = await adminApi.get('/cms/banners/all');
    return data.data;
  } catch (err) {
    return rejectWithValue(errorMessage(err, 'Could not load banners'));
  }
});

// The API only returns the new id, so the list is reloaded afterwards
export const createBanner = createAsyncThunk('banners/create', async (banner, { dispatch, rejectWithValue }) => {
  try {
    const { data } = await adminApi.post('/cms/banners', toFormData(banner));
    dispatch(fetchAllBanners());
    return data;
  } catch (err) {
    return rejectWithValue(errorMessage(err));
  }
});

export const updateBanner = createAsyncThunk('banners/update', async (banner, { dispatch, rejectWithValue }) => {
  try {
    const { data } = await adminApi.put(`/cms/banners/${banner.id}`, toFormData(banner));
    dispatch(fetchAllBanners());
    return data;
  } catch (err) {
    return rejectWithValue(errorMessage(err));
  }
});

export const deleteBanner = createAsyncThunk('banners/delete', async (id, { rejectWithValue }) => {
  try {
    await adminApi.delete(`/cms/banners/${id}`);
    return id;
  } catch (err) {
    return rejectWithValue(errorMessage(err, 'Delete failed'));
  }
});

const bannerSlice = createSlice({
  name: 'banners',
  initialState: {
    items: [],        // admin: all banners
    active: [],       // website: active banners only
    loading: false,   // admin list loading
    saving: false,    // create / update in progress
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchActiveBanners.fulfilled, (state, action) => { state.active = action.payload; })
      .addCase(fetchActiveBanners.rejected, (state) => { state.active = []; }) // website just hides the slider

      .addCase(fetchAllBanners.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchAllBanners.fulfilled, (state, action) => { state.loading = false; state.items = action.payload; })
      .addCase(fetchAllBanners.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

      .addCase(deleteBanner.fulfilled, (state, action) => {
        state.items = state.items.filter((b) => b.id !== action.payload);
        state.active = state.active.filter((b) => b.id !== action.payload);
      });

    // create + update share the saving flag
    [createBanner, updateBanner].forEach((thunk) => {
      builder
        .addCase(thunk.pending, (state) => { state.saving = true; state.error = null; })
        .addCase(thunk.fulfilled, (state) => { state.saving = false; })
        .addCase(thunk.rejected, (state, action) => { state.saving = false; state.error = action.payload; });
    });
  },
});

export default bannerSlice.reducer;
