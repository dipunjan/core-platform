import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiMessage, docId, http, urls, type Category, type Product } from '@/api';
import { catalogKeys } from './keys';

export function useProductsQuery() {
  return useQuery({
    queryKey: catalogKeys.products,
    queryFn: async () => {
      const { data } = await http.get<Product[]>(urls.products);
      return data;
    },
  });
}

export function useCategoriesQuery() {
  return useQuery({
    queryKey: catalogKeys.categories,
    queryFn: async () => {
      const { data } = await http.get<Category[]>(urls.categories);
      return data;
    },
  });
}

export function useProductMutations() {
  const queryClient = useQueryClient();
  const invalidate = () =>
    void queryClient.invalidateQueries({ queryKey: catalogKeys.products });

  const create = useMutation({
    mutationFn: async (body: Record<string, unknown>) => {
      await http.post(urls.products, body);
    },
    onSuccess: invalidate,
  });

  const update = useMutation({
    mutationFn: async (input: { id: string; body: Record<string, unknown> }) => {
      await http.patch(urls.product(input.id), input.body);
    },
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      await http.delete(urls.product(id));
    },
    onSuccess: invalidate,
  });

  return { create, update, remove };
}

export function useCategoryMutations() {
  const queryClient = useQueryClient();
  const invalidate = () =>
    void queryClient.invalidateQueries({ queryKey: catalogKeys.categories });

  const create = useMutation({
    mutationFn: async (body: Record<string, unknown>) => {
      await http.post(urls.categories, body);
    },
    onSuccess: invalidate,
  });

  const update = useMutation({
    mutationFn: async (input: { id: string; body: Record<string, unknown> }) => {
      await http.patch(urls.category(input.id), input.body);
    },
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      await http.delete(urls.category(id));
    },
    onSuccess: invalidate,
  });

  return { create, update, remove };
}

export function productError(err: unknown, fallback: string) {
  return apiMessage(err, fallback);
}

export { docId };
