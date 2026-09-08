import { useEffect, useMemo } from 'react';
import { fetchCategories, fetchShopProducts } from '@/features/catalog';
import type { ShopFilters } from '@/lib/shopFilters';
import { SEARCH_MIN_CHARS } from '@/lib/search';
import { useAppDispatch, useAppSelector } from '@/store/hooks';

function filtersKey(filters: ShopFilters) {
  return JSON.stringify(filters);
}

export function useShop(filters: ShopFilters) {
  const dispatch = useAppDispatch();
  const { shopProducts, shopLoading, categories, error } = useAppSelector(
    (state) => state.catalog,
  );
  const key = useMemo(() => filtersKey(filters), [filters]);
  const qTooShort = Boolean(filters.q && filters.q.length < SEARCH_MIN_CHARS);

  useEffect(() => {
    void dispatch(fetchCategories());
  }, [dispatch]);

  useEffect(() => {
    if (qTooShort) {
      return;
    }
    void dispatch(fetchShopProducts(filters));
  }, [dispatch, key, qTooShort, filters]);

  return {
    products: shopProducts,
    categories,
    loading: shopLoading,
    error,
    qTooShort,
  };
}
