import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import {
  clearCsrfCookie,
  hasCsrfCookie,
  http,
  queryError,
  urls,
  type Address,
  type User,
} from '@/api';
import { authKeys } from './keys';
import { cartKeys } from './keys';

async function fetchMe(): Promise<User | null> {
  if (!hasCsrfCookie()) {
    return null;
  }
  try {
    const { data } = await http.get<User>(urls.me);
    return data;
  } catch (err) {
    if (axios.isAxiosError(err) && err.response?.status === 401) {
      clearCsrfCookie();
    }
    return null;
  }
}

export function useMeQuery() {
  return useQuery({
    queryKey: authKeys.me,
    queryFn: fetchMe,
    retry: false,
    staleTime: Infinity,
  });
}

export function useLoginMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { email: string; password: string }) => {
      const { data } = await http.post<{ user: User }>(urls.login, input);
      return data.user;
    },
    onSuccess: (user) => {
      queryClient.setQueryData(authKeys.me, user);
    },
  });
}

export function useRegisterMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      email: string;
      name: string;
      password: string;
      phone: string;
      address: Address;
    }) => {
      const { data } = await http.post<{ user: User }>(urls.register, input);
      return data.user;
    },
    onSuccess: (user) => {
      queryClient.setQueryData(authKeys.me, user);
    },
  });
}

export function useUpdateMeMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      phone?: string;
      address?: Address;
      name?: string;
    }) => {
      const { data } = await http.patch<User>(urls.me, input);
      return data;
    },
    onSuccess: (user) => {
      queryClient.setQueryData(authKeys.me, user);
    },
  });
}

export function useLogoutMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      try {
        await http.post(urls.logout);
      } catch {
        /* server may already be down */
      }
      clearCsrfCookie();
    },
    onSuccess: () => {
      queryClient.setQueryData(authKeys.me, null);
      queryClient.removeQueries({ queryKey: cartKeys.all });
      queryClient.removeQueries({ queryKey: ['orders'] });
    },
  });
}

export function authErrorMessage(err: unknown, fallback: string): string {
  return queryError(err, fallback);
}
