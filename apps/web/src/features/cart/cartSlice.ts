import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import {
  addGuestItem,
  apiMessage,
  clearGuestCart,
  docId,
  http,
  readGuestCart,
  setGuestQty,
  urls,
  type Address,
  type Cart,
  type Product,
  type User,
} from '@/api';
import { logout } from '@/features/auth';

type CartState = {
  cart: Cart | null;
  loading: boolean;
  error: string;
};

type RootSnap = {
  auth: { user: User | null };
  cart: CartState;
  catalog: { products: Product[] };
};

const initialState: CartState = {
  cart: null,
  loading: false,
  error: '',
};

export const fetchCart = createAsyncThunk(
  'cart/fetch',
  async (_, { getState, rejectWithValue }) => {
    const { user } = (getState() as RootSnap).auth;
    if (!user) {
      return readGuestCart();
    }
    try {
      const { data } = await http.get<Cart>(urls.cart);
      return data;
    } catch (err) {
      return rejectWithValue(apiMessage(err));
    }
  },
);

export const mergeGuestCart = createAsyncThunk(
  'cart/mergeGuest',
  async (_, { rejectWithValue }) => {
    try {
      const guest = readGuestCart();
      for (const item of guest.items) {
        await http.post<Cart>(urls.cartItems, item);
      }
      clearGuestCart();
      const { data } = await http.get<Cart>(urls.cart);
      return data;
    } catch (err) {
      return rejectWithValue(apiMessage(err, 'Could not move cart to your account'));
    }
  },
);

export const addToCart = createAsyncThunk(
  'cart/add',
  async (
    input: { productId: string; quantity: number },
    { getState, rejectWithValue },
  ) => {
    const { user } = (getState() as RootSnap).auth;
    if (!user) {
      return addGuestItem(input.productId, input.quantity);
    }
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
    { getState, rejectWithValue },
  ) => {
    const { user } = (getState() as RootSnap).auth;
    if (!user) {
      return setGuestQty(input.productId, input.quantity);
    }
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
  async (shippingAddress: Address, { getState, rejectWithValue }) => {
    const state = getState() as RootSnap;
    if (!state.auth.user) {
      return rejectWithValue('Sign in to checkout');
    }
    const items = state.cart.cart?.items ?? [];
    if (items.length === 0) {
      return rejectWithValue('Cart is empty');
    }
    const byId = new Map(
      state.catalog.products.map((product) => [docId(product), product]),
    );
    for (const item of items) {
      if (!byId.get(item.productId)) {
        return rejectWithValue('A product in your cart is missing. Refresh.');
      }
    }
    const orderItems = items.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
    }));
    const idempotencyKey =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `${Date.now()}`;
    try {
      await http.post(
        urls.orders,
        { items: orderItems, shippingAddress },
        { headers: { 'Idempotency-Key': idempotencyKey } },
      );
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
    const setCart = (state: CartState, action: { payload: Cart }) => {
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
      .addCase(mergeGuestCart.fulfilled, setCart)
      .addCase(mergeGuestCart.rejected, fail)
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
