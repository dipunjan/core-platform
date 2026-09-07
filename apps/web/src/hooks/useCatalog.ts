import { useCallback, useEffect } from 'react';
import {
  clearProduct,
  fetchCategories,
  fetchInventory,
  fetchProduct,
  fetchProducts,
  fetchStorefront,
} from '@/features/catalog';
import { useAppDispatch, useAppSelector } from '@/store/hooks';

export function useCatalog() {
  const dispatch = useAppDispatch();
  const catalog = useAppSelector((state) => state.catalog);

  const loadCatalog = useCallback(() => {
    void dispatch(fetchProducts());
    void dispatch(fetchCategories());
    void dispatch(fetchStorefront());
  }, [dispatch]);

  const loadStorefront = useCallback(() => {
    void dispatch(fetchStorefront());
  }, [dispatch]);

  return {
    ...catalog,
    loadCatalog,
    loadStorefront,
  };
}

export function useProduct(id: string | undefined) {
  const dispatch = useAppDispatch();
  const { product, inventory, categories, error, loading } = useAppSelector(
    (state) => state.catalog,
  );

  useEffect(() => {
    void dispatch(fetchCategories());
  }, [dispatch]);

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

  return { product, inventory, categories, error, loading };
}
