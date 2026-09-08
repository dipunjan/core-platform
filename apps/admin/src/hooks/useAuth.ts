import { useCallback } from 'react';
import {
  authErrorMessage,
  useLoginMutation,
  useLogoutMutation,
  useMeQuery,
} from '@/query';

export function useAuth() {
  const meQuery = useMeQuery();
  const loginMutation = useLoginMutation();
  const logoutMutation = useLogoutMutation();

  const loadMe = useCallback(() => meQuery.refetch(), [meQuery]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      loginMutation.reset();
      try {
        await loginMutation.mutateAsync({ email, password });
        return true;
      } catch {
        return false;
      }
    },
    [loginMutation],
  );

  const signOut = useCallback(async () => {
    await logoutMutation.mutateAsync();
  }, [logoutMutation]);

  const error = loginMutation.isError
    ? authErrorMessage(loginMutation.error, 'Login failed')
    : '';

  return {
    user: meQuery.data ?? null,
    loading: meQuery.isLoading,
    error,
    loadMe,
    signIn,
    signOut,
  };
}
