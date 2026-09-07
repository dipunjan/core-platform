import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import {
  apiMessage,
  http,
  storefrontIsNewer,
  urls,
  type Storefront,
} from '@/api';

type StorefrontState = {
  storefront: Storefront | null;
  loading: boolean;
  error: string;
};

const initialState: StorefrontState = {
  storefront: null,
  loading: false,
  error: '',
};

export const fetchStorefront = createAsyncThunk(
  'storefront/get',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await http.get<Storefront>(urls.storefront);
      return data;
    } catch (err) {
      return rejectWithValue(apiMessage(err));
    }
  },
);

const storefrontSlice = createSlice({
  name: 'storefront',
  initialState,
  reducers: {
    setStorefront(state, action: { payload: Storefront }) {
      state.storefront = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchStorefront.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchStorefront.fulfilled, (state, action) => {
        state.loading = false;
        if (storefrontIsNewer(action.payload, state.storefront)) {
          state.storefront = action.payload;
        }
        state.error = '';
      })
      .addCase(fetchStorefront.rejected, (state, action) => {
        state.loading = false;
        state.error = String(action.payload ?? 'Could not load storefront');
      });
  },
});

export const { setStorefront } = storefrontSlice.actions;
export const storefrontReducer = storefrontSlice.reducer;
