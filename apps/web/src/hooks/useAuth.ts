import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  authErrorMessage,
  useLoginMutation,
  useLogoutMutation,
  useMeQuery,
  useRegisterMutation,
} from '@/query';
import { cartKeys } from '@/query/keys';
import { useMergeGuestCartMutation } from '@/query/cart';
import type { Address } from '@/api';

export function useAuth() {
  const queryClient = useQueryClient();
  const meQuery = useMeQuery();
  const loginMutation = useLoginMutation();
  const registerMutation = useRegisterMutation();
  const logoutMutation = useLogoutMutation();
  const mergeGuestCart = useMergeGuestCartMutation();

  const loadMe = useCallback(async () => {
    const result = await meQuery.refetch();
    if (result.data) {
      await mergeGuestCart.mutateAsync();
    } else {
      void queryClient.invalidateQueries({ queryKey: cartKeys.all });
    }
  }, [meQuery, mergeGuestCart, queryClient]);

  const afterAuth = useCallback(async () => {
    await mergeGuestCart.mutateAsync();
  }, [mergeGuestCart]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      loginMutation.reset();
      try {
        await loginMutation.mutateAsync({ email, password });
        await afterAuth();
        return true;
      } catch {
        return false;
      }
    },
    [afterAuth, loginMutation],
  );

  const signUp = useCallback(
    async (input: {
      email: string;
      name: string;
      password: string;
      phone: string;
      address: Address;
    }) => {
      registerMutation.reset();
      try {
        await registerMutation.mutateAsync(input);
        await afterAuth();
        return true;
      } catch {
        return false;
      }
    },
    [afterAuth, registerMutation],
  );

  const signOut = useCallback(async () => {
    await logoutMutation.mutateAsync();
  }, [logoutMutation]);

  const error = loginMutation.isError
    ? authErrorMessage(loginMutation.error, 'Login failed')
    : registerMutation.isError
      ? authErrorMessage(registerMutation.error, 'Could not register')
      : '';

  return {
    user: meQuery.data ?? null,
    loading: meQuery.isLoading,
    error,
    loadMe,
    signIn,
    signUp,
    signOut,
  };
}
