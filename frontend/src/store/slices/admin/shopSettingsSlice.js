import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import adminApi from '../../../services/adminApi';
import { errorMessage } from '../../../utils/notify';

// Admin > Contact Us (shop details). One record: only fetched and updated.

export const SHOP_FIELDS = [
  'shop_name', 'tagline', 'description', 'email', 'mobile', 'alt_phone',
  'address_line', 'city', 'state', 'pincode', 'country', 'map_url', 'opening_hours', 'gstin',
  'facebook_url', 'instagram_url', 'twitter_url', 'youtube_url', 'whatsapp',
];

export const fetchShopSettings = createAsyncThunk('shopSettings/fetch', async (_, { rejectWithValue }) => {
  try {
    const { data } = await adminApi.get('/cms/shop');
    return data.data;
  } catch (err) {
    return rejectWithValue(errorMessage(err, 'Could not load shop details'));
  }
});

export const updateShopSettings = createAsyncThunk('shopSettings/update', async (shop, { rejectWithValue }) => {
  try {
    const fd = new FormData();
    SHOP_FIELDS.forEach((k) => fd.append(k, shop[k]));
    if (shop.logo) fd.append('logo', shop.logo);
    const { data } = await adminApi.put('/cms/shop', fd);
    return data.data;
  } catch (err) {
    return rejectWithValue(errorMessage(err, 'Update failed'));
  }
});

const shopSettingsSlice = createSlice({
  name: 'shopSettings',
  initialState: {
    data: null,
    loading: false,
    saving: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchShopSettings.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchShopSettings.fulfilled, (state, action) => { state.loading = false; state.data = action.payload; })
      .addCase(fetchShopSettings.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

      .addCase(updateShopSettings.pending, (state) => { state.saving = true; state.error = null; })
      .addCase(updateShopSettings.fulfilled, (state, action) => { state.saving = false; state.data = action.payload; })
      .addCase(updateShopSettings.rejected, (state, action) => { state.saving = false; state.error = action.payload; });
  },
});

export default shopSettingsSlice.reducer;
