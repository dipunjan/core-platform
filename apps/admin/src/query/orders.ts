import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { docId, http, urls, type Order } from '@/api';
import { orderKeys } from './keys';

export function useAdminOrdersQuery() {
  return useQuery({
    queryKey: orderKeys.admin,
    queryFn: async () => {
      const { data } = await http.get<Order[]>(urls.ordersAdmin);
      return data;
    },
  });
}

export function useAdminOrderStatusMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { id: string; status: string }) => {
      const { data } = await http.patch<Order>(urls.orderAdminStatus(input.id), {
        status: input.status,
      });
      return data;
    },
    onSuccess: (updated) => {
      const id = docId(updated);
      queryClient.setQueryData<Order[]>(orderKeys.admin, (prev) =>
        (prev ?? []).map((order) => (docId(order) === id ? updated : order)),
      );
    },
  });
}
