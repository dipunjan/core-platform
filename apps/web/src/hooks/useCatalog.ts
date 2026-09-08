import { useCallback } from 'react';
import { queryError } from '@/api';
import {
  useCategoriesQuery,
  useInventoryQuery,
  useProductQuery,
  useProductsQuery,
  useStorefrontQuery,
} from '@/query';

export function useStorefront() {
  const storefrontQuery = useStorefrontQuery();

  const loadStorefront = useCallback(() => {
    void storefrontQuery.refetch();
  }, [storefrontQuery]);

  return {
    storefront: storefrontQuery.data ?? null,
    loadStorefront,
  };
}

export function useCatalog(options?: { load?: boolean }) {
  const shouldLoad = options?.load ?? false;
  const storefrontQuery = useStorefrontQuery();
  const productsQuery = useProductsQuery(shouldLoad);
  const categoriesQuery = useCategoriesQuery(shouldLoad);

  const loadCatalog = useCallback(() => {
    void productsQuery.refetch();
    void categoriesQuery.refetch();
  }, [categoriesQuery, productsQuery]);

  const loadStorefront = useCallback(() => {
    void storefrontQuery.refetch();
  }, [storefrontQuery]);

  return {
    products: productsQuery.data ?? [],
    shopProducts: [],
    categories: categoriesQuery.data ?? [],
    storefront: storefrontQuery.data ?? null,
    product: null,
    inventory: null,
    loading: productsQuery.isLoading || categoriesQuery.isLoading,
    shopLoading: false,
    error: queryError(productsQuery.error ?? categoriesQuery.error),
    loadCatalog,
    loadStorefront,
  };
}

export function useProduct(id: string | undefined) {
  const categoriesQuery = useCategoriesQuery(Boolean(id));
  const productQuery = useProductQuery(id);
  const inventoryQuery = useInventoryQuery(id);

  return {
    product: productQuery.data ?? null,
    inventory: inventoryQuery.data ?? null,
    categories: categoriesQuery.data ?? [],
    error: queryError(productQuery.error, 'Product not found'),
    loading: productQuery.isLoading,
  };
}
