import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import {
  apiMessage,
  docId,
  http,
  urls,
  type Cart,
  type OrderItem,
  type Product,
} from '@/api';
import { logout } from '@/features/auth';

type CartState = {
  cart: Cart | null;
  loading: boolean;
  error: string;
};

const initialState: CartState = {
  cart: null,
  loading: false,
  error: '',
};

export const fetchCart = createAsyncThunk(
  'cart/fetch',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await http.get<Cart>(urls.cart);
      return data;
    } catch (err) {
      return rejectWithValue(apiMessage(err));
    }
  },
);

export const addToCart = createAsyncThunk(
  'cart/add',
  async (
    input: { productId: string; quantity: number },
    { rejectWithValue },
  ) => {
    try {
      const { data } = await http.post<Cart>(urls.cartItems, input);
      return data;
    } catch (err) {
      return rejectWithValue(apiMessage(err, 'Could not add to cart'));
    }
  },
);

export const setCartQty = createAsyncThunk(
  'cart/qty',
  async (
    input: { productId: string; quantity: number },
    { rejectWithValue },
  ) => {
    try {
      if (input.quantity < 1) {
        const { data } = await http.delete<Cart>(urls.cartItem(input.productId));
        return data;
      }
      const { data } = await http.patch<Cart>(urls.cartItem(input.productId), {
        quantity: input.quantity,
      });
      return data;
    } catch (err) {
      return rejectWithValue(apiMessage(err, 'Could not update cart'));
    }
  },
);

export const checkout = createAsyncThunk(
  'cart/checkout',
  async (_, { getState, rejectWithValue }) => {
    const state = getState() as {
      cart: CartState;
      catalog: { products: Product[] };
    };
    const items = state.cart.cart?.items ?? [];
    if (items.length === 0) {
      return rejectWithValue('Cart is empty');
    }
    const byId = new Map(
      state.catalog.products.map((product) => [docId(product), product]),
    );
    const orderItems: OrderItem[] = [];
    for (const item of items) {
      const product = byId.get(item.productId);
      if (!product) {
        return rejectWithValue('A product in your cart is missing. Refresh.');
      }
      orderItems.push({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: product.price,
      });
    }
    try {
      await http.post(urls.orders, { items: orderItems });
      await http.delete(urls.cart);
      const { data } = await http.get<Cart>(urls.cart);
      return data;
    } catch (err) {
      return rejectWithValue(apiMessage(err, 'Checkout failed'));
    }
  },
);

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    const setCart = (
      state: CartState,
      action: { payload: Cart },
    ) => {
      state.loading = false;
      state.cart = action.payload;
      state.error = '';
    };
    const fail = (state: CartState, action: { payload: unknown }) => {
      state.loading = false;
      state.error = String(action.payload ?? 'Cart error');
    };

    builder
      .addCase(fetchCart.pending, (state) => {
        state.loading = true;
        state.error = '';
      })
      .addCase(fetchCart.fulfilled, setCart)
      .addCase(fetchCart.rejected, fail)
      .addCase(addToCart.pending, (state) => {
        state.error = '';
      })
      .addCase(addToCart.fulfilled, setCart)
      .addCase(addToCart.rejected, fail)
      .addCase(setCartQty.fulfilled, setCart)
      .addCase(setCartQty.rejected, fail)
      .addCase(checkout.pending, (state) => {
        state.loading = true;
        state.error = '';
      })
      .addCase(checkout.fulfilled, setCart)
      .addCase(checkout.rejected, fail)
      .addCase(logout.fulfilled, () => initialState);
  },
});

export const cartReducer = cartSlice.reducer;
