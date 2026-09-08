import { money } from '@/api';
import { useStorefrontQuery } from '@/query';

export function useMoney() {
  const { data: storefront } = useStorefrontQuery();
  const currency = storefront?.currency ?? 'USD';
  return (cents: number) => money(cents, currency);
}
