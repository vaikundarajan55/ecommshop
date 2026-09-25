import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import siteApi from '../../../services/siteApi';
import { formError, errorMessage } from '../../../utils/notify';

// Website customer auth. Form thunks reject with { message, errors } so pages can mark fields.

export const loginUser = createAsyncThunk('siteAuth/login', async (body, { rejectWithValue }) => {
  try {
    const { data } = await siteApi.post('/auth/login', body);
    return data.data; // { user, token }
  } catch (err) {
    return rejectWithValue(formError(err, 'Login failed'));
  }
});

export const registerUser = createAsyncThunk('siteAuth/register', async (body, { rejectWithValue }) => {
  try {
    const { data } = await siteApi.post('/auth/register', body);
    return data.data; // { user, token }
  } catch (err) {
    return rejectWithValue(formError(err, 'Registration failed'));
  }
});

export const updateProfile = createAsyncThunk('siteAuth/updateProfile', async (body, { rejectWithValue }) => {
  try {
    const { data } = await siteApi.put('/auth/profile', body);
    return data.data; // updated user
  } catch (err) {
    return rejectWithValue(formError(err, 'Update failed'));
  }
});

export const changePassword = createAsyncThunk('siteAuth/changePassword', async (body, { rejectWithValue }) => {
  try {
    await siteApi.post('/auth/change-password', body);
    return true;
  } catch (err) {
    return rejectWithValue(errorMessage(err, 'Failed to change password'));
  }
});

export const forgotPassword = createAsyncThunk('siteAuth/forgotPassword', async (email, { rejectWithValue }) => {
  try {
    await siteApi.post('/auth/forgot-password', { email, portal: 'website' });
    return true;
  } catch (err) {
    return rejectWithValue(errorMessage(err, 'Could not send reset link'));
  }
});

export const resetPassword = createAsyncThunk('siteAuth/resetPassword', async (body, { rejectWithValue }) => {
  try {
    await siteApi.post('/auth/forgot-change-password', body);
    return true;
  } catch (err) {
    return rejectWithValue(errorMessage(err, 'Reset failed'));
  }
});

// One-time image captcha for the login form: { captchaId, svg }
export const fetchCaptcha = createAsyncThunk('siteAuth/captcha', async (_, { rejectWithValue }) => {
  try {
    const { data } = await siteApi.get('/auth/captcha');
    return data.data;
  } catch (err) {
    return rejectWithValue(errorMessage(err, 'Could not load captcha'));
  }
});

const saveUser = (state, user, token) => {
  state.user = user;
  state.token = token;
  localStorage.setItem('site_user', JSON.stringify(user));
  localStorage.setItem('site_token', token);
};

const initialState = {
  user: JSON.parse(localStorage.getItem('site_user') || 'null'),
  token: localStorage.getItem('site_token') || null,
};

const siteAuthSlice = createSlice({
  name: 'siteAuth',
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      saveUser(state, action.payload.user, action.payload.token);
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      localStorage.removeItem('site_user');
      localStorage.removeItem('site_token');
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.fulfilled, (state, action) => { saveUser(state, action.payload.user, action.payload.token); })
      .addCase(registerUser.fulfilled, (state, action) => { saveUser(state, action.payload.user, action.payload.token); })
      .addCase(updateProfile.fulfilled, (state, action) => { saveUser(state, action.payload, state.token); });
  },
});

export const { setCredentials, logout } = siteAuthSlice.actions;
export default siteAuthSlice.reducer;
