import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { apiMessage, docId, http, urls, type Order } from '@/api';
import { logout } from '@/features/auth';

type OrdersState = {
  orders: Order[];
  loading: boolean;
  error: string;
};

const initialState: OrdersState = {
  orders: [],
  loading: false,
  error: '',
};

export const fetchOrders = createAsyncThunk(
  'orders/list',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await http.get<Order[]>(urls.orders);
      return data;
    } catch (err) {
      return rejectWithValue(apiMessage(err));
    }
  },
);

export const cancelOrder = createAsyncThunk(
  'orders/cancel',
  async (id: string, { rejectWithValue }) => {
    try {
      const { data } = await http.patch<Order>(urls.orderStatus(id), {
        status: 'cancelled',
      });
      return data;
    } catch (err) {
      return rejectWithValue(apiMessage(err, 'Could not cancel'));
    }
  },
);

const ordersSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchOrders.pending, (state) => {
        state.loading = true;
        state.error = '';
      })
      .addCase(fetchOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.orders = action.payload;
      })
      .addCase(fetchOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = String(action.payload ?? 'Could not load orders');
      })
      .addCase(cancelOrder.fulfilled, (state, action) => {
        const id = docId(action.payload);
        state.orders = state.orders.map((order) =>
          docId(order) === id ? action.payload : order,
        );
      })
      .addCase(cancelOrder.rejected, (state, action) => {
        state.error = String(action.payload ?? 'Could not cancel');
      })
      .addCase(logout.fulfilled, () => initialState);
  },
});

export const ordersReducer = ordersSlice.reducer;
