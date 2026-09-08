import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiMessage, docId, http, urls, type Order } from '@/api';
import { orderKeys } from './keys';

async function fetchOrders(): Promise<Order[]> {
  const { data } = await http.get<Order[]>(urls.orders);
  return data;
}

export function useOrdersQuery(enabled = true) {
  return useQuery({
    queryKey: orderKeys.list(),
    queryFn: fetchOrders,
    enabled,
  });
}

export function useCancelOrderMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await http.patch<Order>(urls.orderStatus(id), {
        status: 'cancelled',
      });
      return data;
    },
    onSuccess: (updated) => {
      const id = docId(updated);
      queryClient.setQueryData<Order[]>(orderKeys.list(), (prev) =>
        (prev ?? []).map((order) => (docId(order) === id ? updated : order)),
      );
    },
    meta: {
      errorMessage: (err: unknown) => apiMessage(err, 'Could not cancel'),
    },
  });
}
