import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { apiMessage, http, type Inventory, type Product, urls } from '@/api';

type CatalogState = {
  products: Product[];
  product: Product | null;
  inventory: Inventory | null;
  loading: boolean;
  error: string;
};

const initialState: CatalogState = {
  products: [],
  product: null,
  inventory: null,
  loading: false,
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
