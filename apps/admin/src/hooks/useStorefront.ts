import { useCallback } from 'react';
import { useStorefrontQuery } from '@/query';

export function useStorefront() {
  const query = useStorefrontQuery();

  const loadStorefront = useCallback(() => {
    void query.refetch();
  }, [query]);

  return {
    storefront: query.data ?? null,
    loading: query.isLoading,
    error: query.error?.message ?? '',
    loadStorefront,
  };
}
