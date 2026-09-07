import { money } from '@/api';
import { useAppSelector } from '@/store/hooks';

export function useMoney() {
  const currency = useAppSelector(
    (state) => state.catalog.storefront?.currency ?? 'USD',
  );
  return (cents: number) => money(cents, currency);
}
