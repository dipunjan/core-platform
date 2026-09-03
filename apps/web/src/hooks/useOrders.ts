import { useCallback, useEffect } from 'react';
import { cancelOrder, fetchOrders } from '@/features/orders';
import { useAppDispatch, useAppSelector } from '@/store/hooks';

export function useOrders(options?: { load?: boolean }) {
  const dispatch = useAppDispatch();
  const { orders, loading, error } = useAppSelector((state) => state.orders);
  const shouldLoad = options?.load ?? false;

  useEffect(() => {
    if (!shouldLoad) {
      return;
    }
    void dispatch(fetchOrders());
  }, [dispatch, shouldLoad]);

  const cancel = useCallback(
    (id: string) => dispatch(cancelOrder(id)),
    [dispatch],
  );

  return {
    orders,
    loading,
    error,
    cancel,
  };
}
