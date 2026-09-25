import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import adminApi from '../../../services/adminApi';
import { errorMessage, formError } from '../../../utils/notify';
import { clean } from '../../../utils/validators';

// Admin > Product. The list only carries the primary image; fetchProductById returns the full product.

export const PRODUCT_FIELDS = ['category_id', 'subcategory_id', 'name', 'sku', 'description', 'price', 'discount_price', 'stock', 'status', 'highlight'];

const toFormData = (product) => {
  const fd = new FormData();
  PRODUCT_FIELDS.forEach((key) => fd.append(key, ['name', 'sku'].includes(key) ? clean(product[key]) : product[key] ?? ''));
  (product.images || []).forEach((f) => fd.append('images', f));
  return fd;
};

export const fetchProducts = createAsyncThunk('products/fetchAll', async (_, { rejectWithValue }) => {
  try {
    const { data } = await adminApi.get('/products', { params: { limit: 50 } });
    return data.data;
  } catch (err) {
    return rejectWithValue(errorMessage(err, 'Could not load products'));
  }
});

export const fetchProductById = createAsyncThunk('products/fetchOne', async (id, { rejectWithValue }) => {
  try {
    const { data } = await adminApi.get(`/products/${id}`);
    return data.data;
  } catch (err) {
    return rejectWithValue(errorMessage(err, 'Could not load product'));
  }
});

// Create / update reject with { message, errors } so the form can mark fields (e.g. name or SKU already used)
export const createProduct = createAsyncThunk('products/create', async (product, { dispatch, rejectWithValue }) => {
  try {
    const { data } = await adminApi.post('/products', toFormData(product));
    dispatch(fetchProducts());
    return data;
  } catch (err) {
    return rejectWithValue(formError(err));
  }
});

export const updateProduct = createAsyncThunk('products/update', async (product, { dispatch, rejectWithValue }) => {
  try {
    const { data } = await adminApi.put(`/products/${product.id}`, toFormData(product));
    dispatch(fetchProducts());
    return data;
  } catch (err) {
    return rejectWithValue(formError(err));
  }
});

export const deleteProduct = createAsyncThunk('products/delete', async (id, { rejectWithValue }) => {
  try {
    await adminApi.delete(`/products/${id}`);
    return id;
  } catch (err) {
    return rejectWithValue(errorMessage(err, 'Delete failed'));
  }
});

// Image changes reload the list too - its thumbnail follows the primary image
export const deleteProductImage = createAsyncThunk('products/deleteImage', async ({ productId, imageId }, { dispatch, rejectWithValue }) => {
  try {
    await adminApi.delete(`/products/${productId}/images/${imageId}`);
    dispatch(fetchProducts());
    return { productId, imageId };
  } catch (err) {
    return rejectWithValue(errorMessage(err, 'Could not remove image'));
  }
});

export const setPrimaryProductImage = createAsyncThunk('products/setPrimaryImage', async ({ productId, imageId }, { dispatch, rejectWithValue }) => {
  try {
    await adminApi.put(`/products/${productId}/images/${imageId}/primary`);
    dispatch(fetchProducts());
    return { productId, imageId };
  } catch (err) {
    return rejectWithValue(errorMessage(err, 'Could not update main image'));
  }
});

const productSlice = createSlice({
  name: 'products',
  initialState: {
    items: [],
    loading: false,
    saving: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchProducts.fulfilled, (state, action) => { state.loading = false; state.items = action.payload; })
      .addCase(fetchProducts.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

      .addCase(deleteProduct.fulfilled, (state, action) => {
        state.items = state.items.filter((p) => p.id !== action.payload);
      });

    [createProduct, updateProduct].forEach((thunk) => {
      builder
        .addCase(thunk.pending, (state) => { state.saving = true; state.error = null; })
        .addCase(thunk.fulfilled, (state) => { state.saving = false; })
        .addCase(thunk.rejected, (state, action) => { state.saving = false; state.error = action.payload?.message; });
    });
  },
});

export default productSlice.reducer;
