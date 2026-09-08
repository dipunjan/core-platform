import { useQuery } from '@tanstack/react-query';
import { http, urls, type Order } from '@/api';
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
