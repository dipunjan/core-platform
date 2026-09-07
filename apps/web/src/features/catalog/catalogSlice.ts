import axios from 'axios';
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import {
  apiMessage,
  http,
  storefrontIsNewer,
  type Category,
  type Inventory,
  type Product,
  type Storefront,
  urls,
} from '@/api';
import type { ShopFilters } from '@/lib/shopFilters';
import { productsListUrl } from '@/lib/shopFilters';

type CatalogState = {
  products: Product[];
  shopProducts: Product[];
  categories: Category[];
  storefront: Storefront | null;
  product: Product | null;
  inventory: Inventory | null;
  loading: boolean;
  shopLoading: boolean;
  error: string;
};

const initialState: CatalogState = {
  products: [],
  shopProducts: [],
  categories: [],
  storefront: null,
  product: null,
  inventory: null,
  loading: false,
  shopLoading: false,
  error: '',
};

export const fetchProducts = createAsyncThunk(
  'catalog/list',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await http.get<Product[]>(urls.products);
      return data;
    } catch (err) {
      return rejectWithValue(apiMessage(err));
    }
  },
);

export const fetchShopProducts = createAsyncThunk(
  'catalog/shop',
  async (filters: ShopFilters, { signal, rejectWithValue }) => {
    try {
      const { data } = await http.get<Product[]>(productsListUrl(filters), {
        signal,
      });
      return data;
    } catch (err) {
      if (axios.isCancel(err)) {
        throw err;
      }
      return rejectWithValue(apiMessage(err));
    }
  },
);

export const fetchCategories = createAsyncThunk(
  'catalog/categories',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await http.get<Category[]>(urls.categories);
      return data;
    } catch (err) {
      return rejectWithValue(apiMessage(err));
    }
  },
);

export const fetchStorefront = createAsyncThunk(
  'catalog/storefront',
  async () => {
    try {
      const { data } = await http.get<Storefront>(urls.storefront);
      return data;
    } catch {
      return null;
    }
  },
);

export const fetchProduct = createAsyncThunk(
  'catalog/one',
  async (id: string, { rejectWithValue }) => {
    try {
      const { data } = await http.get<Product>(urls.product(id));
      return data;
    } catch (err) {
      return rejectWithValue(apiMessage(err));
    }
  },
);

export const fetchInventory = createAsyncThunk(
  'catalog/inventory',
  async (productId: string) => {
    try {
      const { data } = await http.get<Inventory>(urls.inventory(productId));
      return data;
    } catch {
      return null;
    }
  },
);

const catalogSlice = createSlice({
  name: 'catalog',
  initialState,
  reducers: {
    clearProduct(state) {
      state.product = null;
      state.inventory = null;
      state.error = '';
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending, (state) => {
        state.loading = true;
        state.error = '';
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.products = action.payload;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = String(action.payload ?? 'Could not load products');
      })
      .addCase(fetchShopProducts.pending, (state) => {
        state.shopLoading = true;
        state.error = '';
      })
      .addCase(fetchShopProducts.fulfilled, (state, action) => {
        state.shopLoading = false;
        state.shopProducts = action.payload;
      })
      .addCase(fetchShopProducts.rejected, (state, action) => {
        state.shopLoading = false;
        if (action.meta.aborted) {
          return;
        }
        state.error = String(action.payload ?? 'Could not load products');
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.categories = action.payload;
      })
      .addCase(fetchStorefront.fulfilled, (state, action) => {
        if (storefrontIsNewer(action.payload, state.storefront)) {
          state.storefront = action.payload;
        }
      })
      .addCase(fetchProduct.pending, (state) => {
        state.loading = true;
        state.error = '';
        state.product = null;
      })
      .addCase(fetchProduct.fulfilled, (state, action) => {
        state.loading = false;
        state.product = action.payload;
      })
      .addCase(fetchProduct.rejected, (state, action) => {
        state.loading = false;
        state.error = String(action.payload ?? 'Product not found');
      })
      .addCase(fetchInventory.fulfilled, (state, action) => {
        state.inventory = action.payload;
      });
  },
});

export const { clearProduct } = catalogSlice.actions;
export const catalogReducer = catalogSlice.reducer;
