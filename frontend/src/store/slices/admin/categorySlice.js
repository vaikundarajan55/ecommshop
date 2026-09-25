import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import adminApi from '../../../services/adminApi';
import { errorMessage, formError } from '../../../utils/notify';
import { clean } from '../../../utils/validators';

// Admin > Category. `items` also feeds the category dropdowns on Subcategory and Product.

const toFormData = (category) => {
  const fd = new FormData();
  fd.append('name', clean(category.name));
  fd.append('status', category.status);
  if (category.image) fd.append('image', category.image);
  return fd;
};

export const fetchCategories = createAsyncThunk('categories/fetchAll', async (_, { rejectWithValue }) => {
  try {
    const { data } = await adminApi.get('/categories');
    return data.data;
  } catch (err) {
    return rejectWithValue(errorMessage(err, 'Could not load categories'));
  }
});

// Create / update reject with { message, errors } so the form can mark the name field
export const createCategory = createAsyncThunk('categories/create', async (category, { dispatch, rejectWithValue }) => {
  try {
    const { data } = await adminApi.post('/categories', toFormData(category));
    dispatch(fetchCategories());
    return data;
  } catch (err) {
    return rejectWithValue(formError(err));
  }
});

export const updateCategory = createAsyncThunk('categories/update', async (category, { dispatch, rejectWithValue }) => {
  try {
    const { data } = await adminApi.put(`/categories/${category.id}`, toFormData(category));
    dispatch(fetchCategories());
    return data;
  } catch (err) {
    return rejectWithValue(formError(err));
  }
});

export const deleteCategory = createAsyncThunk('categories/delete', async (id, { rejectWithValue }) => {
  try {
    await adminApi.delete(`/categories/${id}`);
    return id;
  } catch (err) {
    return rejectWithValue(errorMessage(err, 'Delete failed'));
  }
});

const categorySlice = createSlice({
  name: 'categories',
  initialState: {
    items: [],
    loading: false,
    saving: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCategories.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchCategories.fulfilled, (state, action) => { state.loading = false; state.items = action.payload; })
      .addCase(fetchCategories.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

      .addCase(deleteCategory.fulfilled, (state, action) => {
        state.items = state.items.filter((c) => c.id !== action.payload);
      });

    [createCategory, updateCategory].forEach((thunk) => {
      builder
        .addCase(thunk.pending, (state) => { state.saving = true; state.error = null; })
        .addCase(thunk.fulfilled, (state) => { state.saving = false; })
        .addCase(thunk.rejected, (state, action) => { state.saving = false; state.error = action.payload?.message; });
    });
  },
});

export default categorySlice.reducer;
