import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiMessage, http, urls, type Inventory } from '@/api';
import { inventoryKeys } from './keys';

export function useInventoryQuery() {
  return useQuery({
    queryKey: inventoryKeys.list,
    queryFn: async () => {
      const { data } = await http.get<Inventory[]>(urls.inventory);
      return data;
    },
  });
}

export function useUpdateInventoryMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { productId: string; quantity: number }) => {
      await http.put(urls.inventoryItem(input.productId), {
        quantity: input.quantity,
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: inventoryKeys.list });
    },
    meta: {
      errorMessage: (err: unknown) => apiMessage(err),
    },
  });
}
