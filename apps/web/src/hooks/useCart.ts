import { useCallback, useEffect, useMemo } from 'react';
import { docId, type Product } from '@/api';
import { addToCart, checkout, fetchCart, setCartQty } from '@/features/cart';
import { fetchProducts } from '@/features/catalog';
import { useAppDispatch, useAppSelector } from '@/store/hooks';

export function useCart(options?: { load?: boolean }) {
  const dispatch = useAppDispatch();
  const { cart, loading, error } = useAppSelector((state) => state.cart);
  const products = useAppSelector((state) => state.catalog.products);
  const shouldLoad = options?.load ?? false;

  useEffect(() => {
    if (!shouldLoad) {
      return;
    }
    void dispatch(fetchCart());
    void dispatch(fetchProducts());
  }, [dispatch, shouldLoad]);

  const productsById = useMemo(() => {
    const map = new Map<string, Product>();
    for (const product of products) {
      map.set(docId(product), product);
    }
    return map;
  }, [products]);

  const addItem = useCallback(
    async (productId: string, quantity = 1) => {
      const result = await dispatch(addToCart({ productId, quantity }));
      return addToCart.fulfilled.match(result);
    },
    [dispatch],
  );

  const setQty = useCallback(
    (productId: string, quantity: number) =>
      dispatch(setCartQty({ productId, quantity })),
    [dispatch],
  );

  const placeOrder = useCallback(
    async (shippingAddress: Parameters<typeof checkout>[0]) => {
      const result = await dispatch(checkout(shippingAddress));
      return checkout.fulfilled.match(result);
    },
    [dispatch],
  );

  return {
    cart,
    loading,
    error,
    productsById,
    addItem,
    setQty,
    placeOrder,
  };
}
