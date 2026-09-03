import { configureStore } from '@reduxjs/toolkit';
import { authReducer } from '@/features/auth';
import { cartReducer } from '@/features/cart';
import { catalogReducer } from '@/features/catalog';
import { ordersReducer } from '@/features/orders';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    catalog: catalogReducer,
    cart: cartReducer,
    orders: ordersReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
