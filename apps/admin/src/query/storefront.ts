import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { http, urls, type Storefront } from '@/api';
import { storefrontKeys } from './keys';

export function useStorefrontQuery() {
  return useQuery({
    queryKey: storefrontKeys.detail,
    queryFn: async () => {
      const { data } = await http.get<Storefront>(urls.storefront);
      return data;
    },
    staleTime: 60_000,
  });
}

export function usePatchStorefrontMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: Partial<Storefront> | Record<string, unknown>) => {
      const { data } = await http.patch<Storefront>(urls.storefront, body);
      return data;
    },
    onSuccess: (storefront) => {
      queryClient.setQueryData(storefrontKeys.detail, storefront);
    },
  });
}

export function useBannerMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      method: 'post' | 'patch' | 'delete';
      url: string;
      body?: Record<string, unknown>;
    }) => {
      if (input.method === 'delete') {
        const { data } = await http.delete<Storefront>(input.url);
        return data;
      }
      if (input.method === 'patch') {
        const { data } = await http.patch<Storefront>(input.url, input.body);
        return data;
      }
      const { data } = await http.post<Storefront>(input.url, input.body);
      return data;
    },
    onSuccess: (storefront) => {
      queryClient.setQueryData(storefrontKeys.detail, storefront);
    },
  });
}
