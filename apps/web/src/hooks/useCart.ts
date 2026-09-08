import { useEffect, useMemo } from 'react';
import { docId, type Product } from '@/api';
import {
  useAddToCartMutation,
  useCartQuery,
  useCheckoutMutation,
  useProductsQuery,
  useSetCartQtyMutation,
} from '@/query';

export function useCart(options?: { load?: boolean }) {
  const shouldLoad = options?.load ?? false;
  const cartQuery = useCartQuery();
  const productsQuery = useProductsQuery(shouldLoad);
  const addMutation = useAddToCartMutation();
  const qtyMutation = useSetCartQtyMutation();
  const checkoutMutation = useCheckoutMutation();

  useEffect(() => {
    if (shouldLoad) {
      void cartQuery.refetch();
      void productsQuery.refetch();
    }
  }, [cartQuery, productsQuery, shouldLoad]);

  const productsById = useMemo(() => {
    const map = new Map<string, Product>();
    for (const product of productsQuery.data ?? []) {
      map.set(docId(product), product);
    }
    return map;
  }, [productsQuery.data]);

  const loading =
    cartQuery.isLoading ||
    cartQuery.isFetching ||
    addMutation.isPending ||
    qtyMutation.isPending ||
    checkoutMutation.isPending;

  const error =
    cartQuery.error?.message ??
    addMutation.error?.message ??
    qtyMutation.error?.message ??
    checkoutMutation.error?.message ??
    '';

  return {
    cart: cartQuery.data ?? null,
    loading,
    error,
    productsById,
    addItem: async (productId: string, quantity = 1) => {
      try {
        await addMutation.mutateAsync({ productId, quantity });
        return true;
      } catch {
        return false;
      }
    },
    setQty: (productId: string, quantity: number) => {
      void qtyMutation.mutate({ productId, quantity });
    },
    placeOrder: async (
      shippingAddress: Parameters<typeof checkoutMutation.mutateAsync>[0],
    ) => {
      try {
        await checkoutMutation.mutateAsync(shippingAddress);
        return true;
      } catch {
        return false;
      }
    },
  };
}
