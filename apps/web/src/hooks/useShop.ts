import { queryError } from '@/api';
import { useCategoriesQuery, useShopProductsQuery } from '@/query';
import type { ShopFilters } from '@/lib/shopFilters';
import { SEARCH_MIN_CHARS } from '@/lib/search';

export function useShop(filters: ShopFilters) {
  const categoriesQuery = useCategoriesQuery();
  const qTooShort = Boolean(filters.q && filters.q.length < SEARCH_MIN_CHARS);
  const shopQuery = useShopProductsQuery(filters);

  return {
    products: shopQuery.data ?? [],
    categories: categoriesQuery.data ?? [],
    loading: shopQuery.isLoading || shopQuery.isFetching,
    error: queryError(shopQuery.error, 'Could not load products'),
    qTooShort,
  };
}
