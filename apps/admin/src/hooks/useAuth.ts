import { useCallback } from 'react';
import { fetchMe, login, logout } from '@/features/auth';
import { useAppDispatch, useAppSelector } from '@/store/hooks';

export function useAuth() {
  const dispatch = useAppDispatch();
  const { user, loading, error } = useAppSelector((state) => state.auth);

  const loadMe = useCallback(() => dispatch(fetchMe()), [dispatch]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      const result = await dispatch(login({ email, password }));
      return login.fulfilled.match(result);
    },
    [dispatch],
  );

  const signOut = useCallback(() => dispatch(logout()), [dispatch]);

  return { user, loading, error, loadMe, signIn, signOut };
}
