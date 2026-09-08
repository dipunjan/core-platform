import { useEffect, useMemo } from 'react';
import { docId, queryError, type Product } from '@/api';
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
    if (!shouldLoad) {
      return;
    }
    void cartQuery.refetch();
    void productsQuery.refetch();
    // Only refresh when entering a page that opts into load — not on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldLoad]);

  const productsById = useMemo(() => {
    const map = new Map<string, Product>();
    for (const product of productsQuery.data ?? []) {
      map.set(docId(product), product);
    }
    return map;
  }, [productsQuery.data]);

  const loading = cartQuery.isLoading && cartQuery.data === undefined;

  const mutating =
    addMutation.isPending ||
    qtyMutation.isPending ||
    checkoutMutation.isPending;

  const error = queryError(
    cartQuery.error ??
      addMutation.error ??
      qtyMutation.error ??
      checkoutMutation.error,
  );

  const qtyByProductId = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of cartQuery.data?.items ?? []) {
      map.set(item.productId, item.quantity);
    }
    return map;
  }, [cartQuery.data?.items]);

  return {
    cart: cartQuery.data ?? null,
    loading,
    mutating,
    error,
    productsById,
    qtyFor: (productId: string) => qtyByProductId.get(productId) ?? 0,
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
        const order = await checkoutMutation.mutateAsync(shippingAddress);
        return docId(order);
      } catch {
        return null;
      }
    },
  };
}
