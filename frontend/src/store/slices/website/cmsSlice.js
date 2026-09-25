import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import siteApi from '../../../services/siteApi';
import { errorMessage } from '../../../utils/notify';
import { STORE } from '../../../utils/storeInfo';

// Website content managed from admin: shop details, About page, testimonials, plus the contact form.

// Shop details used until they load (or if the request fails): .env / placeholder values
export const SHOP_FALLBACK = {
  shop_name: 'ShopEase',
  tagline: 'Everyday essentials, delivered fast',
  description: 'Your one-stop shop for electronics, fashion and home essentials. Honest prices, secure checkout and live tracking from order to doorstep.',
  logo: null,
  email: STORE.email,
  mobile: STORE.phone,
  address_line: STORE.address,
  opening_hours: STORE.hours,
};

// Empty values from the API keep the fallback
const withFallback = (data) => ({
  ...SHOP_FALLBACK,
  ...Object.fromEntries(Object.entries(data || {}).filter(([, v]) => v !== null && v !== '')),
});

export const fetchShop = createAsyncThunk('cms/fetchShop', async (_, { rejectWithValue }) => {
  try {
    const { data } = await siteApi.get('/cms/shop');
    return data.data;
  } catch (err) {
    return rejectWithValue(errorMessage(err));
  }
}, {
  condition: (_, { getState }) => getState().cms.shopStatus === 'idle', // load once, shared by every component
});

export const fetchAbout = createAsyncThunk('cms/fetchAbout', async (_, { rejectWithValue }) => {
  try {
    const { data } = await siteApi.get('/cms/about');
    return data.data;
  } catch (err) {
    return rejectWithValue(errorMessage(err, 'Could not load page'));
  }
});

export const fetchTestimonials = createAsyncThunk('cms/fetchTestimonials', async (_, { rejectWithValue }) => {
  try {
    const { data } = await siteApi.get('/cms/testimonials');
    return data.data;
  } catch (err) {
    return rejectWithValue(errorMessage(err));
  }
});

// Resolves with the server's thank-you message
export const sendContactMessage = createAsyncThunk('cms/sendContact', async (form, { rejectWithValue }) => {
  try {
    const { data } = await siteApi.post('/cms/contact', form);
    return data.message;
  } catch (err) {
    return rejectWithValue(errorMessage(err, 'Could not send your message'));
  }
});

// Page view log for Admin > Visitors (the server reads the IP address)
export const trackVisit = createAsyncThunk('cms/trackVisit', async (body, { rejectWithValue }) => {
  try {
    await siteApi.post('/visitors/track', body);
    return true;
  } catch (err) {
    return rejectWithValue(errorMessage(err));
  }
});

const cmsSlice = createSlice({
  name: 'cms',
  initialState: {
    shop: SHOP_FALLBACK,
    shopStatus: 'idle',  // idle | loading | done
    about: null,
    aboutFailed: false,
    testimonials: [],
  },
  reducers: {
    // Called by Admin > Shop settings after saving so the header/footer update without a reload
    setShop: (state, action) => {
      state.shop = withFallback(action.payload);
      state.shopStatus = 'done';
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchShop.pending, (state) => { state.shopStatus = 'loading'; })
      .addCase(fetchShop.fulfilled, (state, action) => { state.shopStatus = 'done'; state.shop = withFallback(action.payload); })
      .addCase(fetchShop.rejected, (state) => { state.shopStatus = 'done'; })

      .addCase(fetchAbout.pending, (state) => { state.aboutFailed = false; })
      .addCase(fetchAbout.fulfilled, (state, action) => { state.about = action.payload; })
      .addCase(fetchAbout.rejected, (state) => { state.aboutFailed = true; })

      .addCase(fetchTestimonials.fulfilled, (state, action) => { state.testimonials = action.payload; })
      .addCase(fetchTestimonials.rejected, (state) => { state.testimonials = []; }); // section is just hidden
  },
});

export const { setShop } = cmsSlice.actions;
export default cmsSlice.reducer;
