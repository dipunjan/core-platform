import { configureStore } from '@reduxjs/toolkit';
import { authReducer } from '@/features/auth';
import { storefrontReducer } from '@/features/storefront';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    storefront: storefrontReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
