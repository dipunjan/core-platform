import { useEffect } from 'react';
import { useCancelOrderMutation, useOrdersQuery } from '@/query';

export function useOrders(options?: { load?: boolean }) {
  const shouldLoad = options?.load ?? false;
  const ordersQuery = useOrdersQuery(shouldLoad);
  const cancelMutation = useCancelOrderMutation();

  useEffect(() => {
    if (shouldLoad) {
      void ordersQuery.refetch();
    }
  }, [ordersQuery, shouldLoad]);

  return {
    orders: ordersQuery.data ?? [],
    loading: ordersQuery.isLoading || cancelMutation.isPending,
    error: ordersQuery.error?.message ?? cancelMutation.error?.message ?? '',
    cancel: (id: string) => {
      void cancelMutation.mutate(id);
    },
  };
}
