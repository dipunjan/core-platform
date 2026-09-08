import { useCallback } from 'react';
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
    error:
      productsQuery.error?.message ?? categoriesQuery.error?.message ?? '',
    loadCatalog,
    loadStorefront,
  };
}

export function useProduct(id: string | undefined) {
  const categoriesQuery = useCategoriesQuery(Boolean(id));
  const productQuery = useProductQuery(id);
  const inventoryQuery = useInventoryQuery(id);

  const error =
    productQuery.error instanceof Error
      ? productQuery.error.message
      : productQuery.isError
        ? 'Product not found'
        : '';

  return {
    product: productQuery.data ?? null,
    inventory: inventoryQuery.data ?? null,
    categories: categoriesQuery.data ?? [],
    error,
    loading: productQuery.isLoading,
  };
}
