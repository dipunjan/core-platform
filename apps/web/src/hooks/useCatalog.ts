import { useCallback, useEffect } from 'react';
import {
  clearProduct,
  fetchInventory,
  fetchProduct,
  fetchProducts,
} from '@/features/catalog';
import { useAppDispatch, useAppSelector } from '@/store/hooks';

export function useCatalog() {
  const dispatch = useAppDispatch();
  const catalog = useAppSelector((state) => state.catalog);

  const loadProducts = useCallback(
    () => dispatch(fetchProducts()),
    [dispatch],
  );

  return {
    ...catalog,
    loadProducts,
  };
}

export function useProduct(id: string | undefined) {
  const dispatch = useAppDispatch();
  const { product, inventory, error, loading } = useAppSelector(
    (state) => state.catalog,
  );

  useEffect(() => {
    if (!id) {
      return;
    }
    void dispatch(fetchProduct(id));
    void dispatch(fetchInventory(id));
    return () => {
      dispatch(clearProduct());
    };
  }, [dispatch, id]);

  return { product, inventory, error, loading };
}
