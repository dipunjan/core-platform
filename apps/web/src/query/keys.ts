import type { ShopFilters } from '@/lib/shopFilters';

export const authKeys = {
  me: ['auth', 'me'] as const,
};

export const catalogKeys = {
  all: ['catalog'] as const,
  storefront: () => [...catalogKeys.all, 'storefront'] as const,
  products: () => [...catalogKeys.all, 'products'] as const,
  categories: () => [...catalogKeys.all, 'categories'] as const,
  shop: (filters: ShopFilters) => [...catalogKeys.all, 'shop', filters] as const,
  product: (id: string) => [...catalogKeys.all, 'product', id] as const,
  inventory: (productId: string) =>
    [...catalogKeys.all, 'inventory', productId] as const,
};

export const cartKeys = {
  all: ['cart'] as const,
  detail: (userId: string | null) => [...cartKeys.all, userId ?? 'guest'] as const,
};

export const orderKeys = {
  all: ['orders'] as const,
  list: () => [...orderKeys.all, 'list'] as const,
  detail: (id: string) => [...orderKeys.all, 'detail', id] as const,
};
