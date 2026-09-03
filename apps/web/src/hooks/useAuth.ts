import { useCallback } from 'react';
import { fetchMe, login, logout, register } from '@/features/auth';
import { fetchCart } from '@/features/cart';
import { useAppDispatch, useAppSelector } from '@/store/hooks';

export function useAuth() {
  const dispatch = useAppDispatch();
  const { user, loading, error } = useAppSelector((state) => state.auth);

  const loadMe = useCallback(() => dispatch(fetchMe()), [dispatch]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      const result = await dispatch(login({ email, password }));
      if (login.fulfilled.match(result)) {
        void dispatch(fetchCart());
        return true;
      }
      return false;
    },
    [dispatch],
  );

  const signUp = useCallback(
    async (email: string, name: string, password: string) => {
      const result = await dispatch(register({ email, name, password }));
      if (register.fulfilled.match(result)) {
        void dispatch(fetchCart());
        return true;
      }
      return false;
    },
    [dispatch],
  );

  const signOut = useCallback(() => dispatch(logout()), [dispatch]);

  return { user, loading, error, loadMe, signIn, signUp, signOut };
}

