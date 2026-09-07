import { useCallback } from 'react';
import { fetchStorefront, setStorefront } from '@/features/storefront';
import type { Storefront } from '@/api';
import { useAppDispatch, useAppSelector } from '@/store/hooks';

export function useStorefront() {
  const dispatch = useAppDispatch();
  const { storefront, loading, error } = useAppSelector(
    (state) => state.storefront,
  );

  const loadStorefront = useCallback(
    () => dispatch(fetchStorefront()),
    [dispatch],
  );

  const remember = useCallback(
    (row: Storefront) => {
      dispatch(setStorefront(row));
    },
    [dispatch],
  );

  return { storefront, loading, error, loadStorefront, remember };
}
