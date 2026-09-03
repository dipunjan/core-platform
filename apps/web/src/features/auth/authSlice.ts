import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from 'axios';
import {
  apiMessage,
  clearCsrfCookie,
  hasCsrfCookie,
  http,
  urls,
  type User,
} from '@/api';

type AuthState = {
  user: User | null;
  loading: boolean;
  error: string;
};

const initialState: AuthState = {
  user: null,
  loading: true,
  error: '',
};

export const fetchMe = createAsyncThunk('auth/me', async () => {
  if (!hasCsrfCookie()) {
    return null;
  }
  try {
    const { data } = await http.get<User>(urls.me);
    return data;
  } catch (err) {
    if (axios.isAxiosError(err) && err.response?.status === 401) {
      clearCsrfCookie();
    }
    return null;
  }
});

export const login = createAsyncThunk(
  'auth/login',
  async (input: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const { data } = await http.post<{ user: User }>(urls.login, input);
      return data.user;
    } catch (err) {
      return rejectWithValue(apiMessage(err, 'Login failed'));
    }
  },
);

export const register = createAsyncThunk(
  'auth/register',
  async (
    input: { email: string; name: string; password: string },
    { rejectWithValue },
  ) => {
    try {
      const { data } = await http.post<{ user: User }>(urls.register, input);
      return data.user;
    } catch (err) {
      return rejectWithValue(apiMessage(err, 'Could not register'));
    }
  },
);

export const logout = createAsyncThunk('auth/logout', async () => {
  try {
    await http.post(urls.logout);
  } catch {
    /* server may already be down */
  }
  clearCsrfCookie();
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchMe.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchMe.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.error = '';
      })
      .addCase(login.pending, (state) => {
        state.error = '';
      })
      .addCase(login.fulfilled, (state, action) => {
        state.user = action.payload;
        state.error = '';
      })
      .addCase(login.rejected, (state, action) => {
        state.error = String(action.payload ?? 'Login failed');
      })
      .addCase(register.pending, (state) => {
        state.error = '';
      })
      .addCase(register.fulfilled, (state, action) => {
        state.user = action.payload;
        state.error = '';
      })
      .addCase(register.rejected, (state, action) => {
        state.error = String(action.payload ?? 'Could not register');
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.error = '';
      });
  },
});

export const authReducer = authSlice.reducer;
