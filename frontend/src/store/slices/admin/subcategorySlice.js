import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import adminApi from '../../../services/adminApi';
import { errorMessage, formError } from '../../../utils/notify';
import { clean } from '../../../utils/validators';

// Admin > Subcategory. `items` also feeds the subcategory dropdown on Product.

const toFormData = (sub) => {
  const fd = new FormData();
  fd.append('category_id', sub.category_id);
  fd.append('name', clean(sub.name));
  fd.append('status', sub.status);
  if (sub.image) fd.append('image', sub.image);
  return fd;
};

export const fetchSubcategories = createAsyncThunk('subcategories/fetchAll', async (_, { rejectWithValue }) => {
  try {
    const { data } = await adminApi.get('/subcategories');
    return data.data;
  } catch (err) {
    return rejectWithValue(errorMessage(err, 'Could not load subcategories'));
  }
});

// Create / update reject with { message, errors } so the form can mark the name field
export const createSubcategory = createAsyncThunk('subcategories/create', async (sub, { dispatch, rejectWithValue }) => {
  try {
    const { data } = await adminApi.post('/subcategories', toFormData(sub));
    dispatch(fetchSubcategories());
    return data;
  } catch (err) {
    return rejectWithValue(formError(err));
  }
});

export const updateSubcategory = createAsyncThunk('subcategories/update', async (sub, { dispatch, rejectWithValue }) => {
  try {
    const { data } = await adminApi.put(`/subcategories/${sub.id}`, toFormData(sub));
    dispatch(fetchSubcategories());
    return data;
  } catch (err) {
    return rejectWithValue(formError(err));
  }
});

export const deleteSubcategory = createAsyncThunk('subcategories/delete', async (id, { rejectWithValue }) => {
  try {
    await adminApi.delete(`/subcategories/${id}`);
    return id;
  } catch (err) {
    return rejectWithValue(errorMessage(err, 'Delete failed'));
  }
});

const subcategorySlice = createSlice({
  name: 'subcategories',
  initialState: {
    items: [],
    loading: false,
    saving: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchSubcategories.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchSubcategories.fulfilled, (state, action) => { state.loading = false; state.items = action.payload; })
      .addCase(fetchSubcategories.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

      .addCase(deleteSubcategory.fulfilled, (state, action) => {
        state.items = state.items.filter((s) => s.id !== action.payload);
      });

    [createSubcategory, updateSubcategory].forEach((thunk) => {
      builder
        .addCase(thunk.pending, (state) => { state.saving = true; state.error = null; })
        .addCase(thunk.fulfilled, (state) => { state.saving = false; })
        .addCase(thunk.rejected, (state, action) => { state.saving = false; state.error = action.payload?.message; });
    });
  },
});

export default subcategorySlice.reducer;
