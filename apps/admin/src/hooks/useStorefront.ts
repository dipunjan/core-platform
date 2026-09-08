import { useCallback } from 'react';
import { queryError } from '@/api';
import { useStorefrontQuery } from '@/query';

export function useStorefront() {
  const query = useStorefrontQuery();

  const loadStorefront = useCallback(() => {
    void query.refetch();
  }, [query]);

  return {
    storefront: query.data ?? null,
    loading: query.isLoading,
    error: queryError(query.error),
    loadStorefront,
  };
}
