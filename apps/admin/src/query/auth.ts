import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import {
  apiMessage,
  clearCsrfCookie,
  hasCsrfCookie,
  http,
  urls,
  type User,
} from '@/api';
import { authKeys } from './keys';

async function fetchMe(): Promise<User | null> {
  if (!hasCsrfCookie()) {
    return null;
  }
  try {
    const { data } = await http.get<User>(urls.me);
    return data.role === 'admin' ? data : null;
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
      if (data.user.role !== 'admin') {
        await http.post(urls.logout).catch(() => undefined);
        clearCsrfCookie();
        throw new Error('Staff only. This account is a shopper, not an admin.');
      }
      return data.user;
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
    },
  });
}

export function authErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error) {
    return err.message;
  }
  return apiMessage(err, fallback);
}
