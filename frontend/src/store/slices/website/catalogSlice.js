import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import siteApi from '../../../services/siteApi';
import { errorMessage } from '../../../utils/notify';

// Website catalogue: home page product rows, the product list, categories and product details.

const getProducts = async (params) => (await siteApi.get('/products', { params: { status: 'active', ...params } })).data.data;

// Products marked "Featured" in admin; falls back to the latest ones until some are marked
export const fetchFeaturedProducts = createAsyncThunk('catalog/fetchFeatured', async (_, { rejectWithValue }) => {
  try {
    const featured = await getProducts({ limit: 8, highlight: 'featured' });
    return featured.length ? featured : await getProducts({ limit: 8 });
  } catch (err) {
    return rejectWithValue(errorMessage(err, 'Could not load products'));
  }
});

// Products marked "Current product" in admin
export const fetchCurrentProducts = createAsyncThunk('catalog/fetchCurrent', async (_, { rejectWithValue }) => {
  try {
    return await getProducts({ limit: 8, highlight: 'current' });
  } catch (err) {
    return rejectWithValue(errorMessage(err, 'Could not load products'));
  }
});

// Product list page: { categoryId, search }
export const fetchProducts = createAsyncThunk('catalog/fetchProducts', async ({ categoryId, search } = {}, { rejectWithValue }) => {
  try {
    return await getProducts({ categoryId: categoryId || undefined, search: search || undefined, limit: 24 });
  } catch (err) {
    return rejectWithValue(errorMessage(err, 'Could not load products'));
  }
});

export const fetchActiveCategories = createAsyncThunk('catalog/fetchCategories', async (_, { rejectWithValue }) => {
  try {
    const { data } = await siteApi.get('/categories', { params: { status: 'active' } });
    return data.data;
  } catch (err) {
    return rejectWithValue(errorMessage(err, 'Could not load categories'));
  }
});

// Product page + quick view. Images are sorted so the primary one comes first.
export const fetchProductById = createAsyncThunk('catalog/fetchProduct', async (id, { rejectWithValue }) => {
  try {
    const { data } = await siteApi.get(`/products/${id}`);
    const p = data.data;
    return { ...p, images: [...(p.images || [])].sort((a, b) => b.is_primary - a.is_primary) };
  } catch (err) {
    return rejectWithValue(errorMessage(err, 'Could not load product'));
  }
});

const catalogSlice = createSlice({
  name: 'catalog',
  initialState: {
    featured: [],
    featuredLoading: true,
    current: [],
    products: [],          // product list page
    productsLoading: true,
    categories: [],
    categoriesLoading: true,
    details: {},           // product details by id
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchFeaturedProducts.pending, (state) => { state.featuredLoading = true; })
      .addCase(fetchFeaturedProducts.fulfilled, (state, action) => { state.featuredLoading = false; state.featured = action.payload; })
      .addCase(fetchFeaturedProducts.rejected, (state) => { state.featuredLoading = false; })

      .addCase(fetchCurrentProducts.fulfilled, (state, action) => { state.current = action.payload; })
      .addCase(fetchCurrentProducts.rejected, (state) => { state.current = []; }) // section is just hidden

      .addCase(fetchProducts.pending, (state) => { state.productsLoading = true; })
      .addCase(fetchProducts.fulfilled, (state, action) => { state.productsLoading = false; state.products = action.payload; })
      .addCase(fetchProducts.rejected, (state) => { state.productsLoading = false; })

      .addCase(fetchActiveCategories.pending, (state) => { state.categoriesLoading = true; })
      .addCase(fetchActiveCategories.fulfilled, (state, action) => { state.categoriesLoading = false; state.categories = action.payload; })
      .addCase(fetchActiveCategories.rejected, (state) => { state.categoriesLoading = false; })

      .addCase(fetchProductById.fulfilled, (state, action) => { state.details[action.payload.id] = action.payload; });
  },
});

export default catalogSlice.reducer;
