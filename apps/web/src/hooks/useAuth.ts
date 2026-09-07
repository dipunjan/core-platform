import { useCallback } from 'react';
import { fetchMe, login, logout, register } from '@/features/auth';
import { fetchCart, mergeGuestCart } from '@/features/cart';
import type { Address } from '@/api';
import { useAppDispatch, useAppSelector } from '@/store/hooks';

export function useAuth() {
  const dispatch = useAppDispatch();
  const { user, loading, error } = useAppSelector((state) => state.auth);

  const loadMe = useCallback(async () => {
    const result = await dispatch(fetchMe());
    if (fetchMe.fulfilled.match(result) && result.payload) {
      await dispatch(mergeGuestCart());
    } else {
      await dispatch(fetchCart());
    }
  }, [dispatch]);

  const afterAuth = useCallback(async () => {
    await dispatch(mergeGuestCart());
  }, [dispatch]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      const result = await dispatch(login({ email, password }));
      if (login.fulfilled.match(result)) {
        await afterAuth();
        return true;
      }
      return false;
    },
    [afterAuth, dispatch],
  );

  const signUp = useCallback(
    async (input: {
      email: string;
      name: string;
      password: string;
      phone: string;
      address: Address;
    }) => {
      const result = await dispatch(register(input));
      if (register.fulfilled.match(result)) {
        await afterAuth();
        return true;
      }
      return false;
    },
    [afterAuth, dispatch],
  );

  const signOut = useCallback(() => dispatch(logout()), [dispatch]);

  return { user, loading, error, loadMe, signIn, signUp, signOut };
}
