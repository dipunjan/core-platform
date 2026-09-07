import type { Product } from '@/api/types';

export type ShopSort =
  | 'name-asc'
  | 'name-desc'
  | 'price-asc'
  | 'price-desc'
  | 'newest';

export type ShopFilters = {
  category?: string;
  q?: string;
  minPrice?: number;
  maxPrice?: number;
  sort: ShopSort;
};

export const SHOP_SORT_OPTIONS: { value: ShopSort; label: string }[] = [
  { value: 'name-asc', label: 'Name (A–Z)' },
  { value: 'name-desc', label: 'Name (Z–A)' },
  { value: 'price-asc', label: 'Price (low to high)' },
  { value: 'price-desc', label: 'Price (high to low)' },
  { value: 'newest', label: 'Newest' },
];

export function parseShopFilters(
  categorySlug?: string,
  search = '',
): ShopFilters {
  const params = new URLSearchParams(search);
  const min = parseCents(params.get('min'));
  const max = parseCents(params.get('max'));
  const sort = parseSort(params.get('sort'));
  const category = categorySlug || params.get('category') || undefined;
  const q = params.get('q')?.trim() || undefined;

  return {
    category,
    q,
    minPrice: min,
    maxPrice: max,
    sort,
  };
}

export function buildShopUrl(filters: ShopFilters): string {
  const path = filters.category ? `/shop/${filters.category}` : '/shop';
  const params = new URLSearchParams();
  if (filters.q) {
    params.set('q', filters.q);
  }
  if (filters.minPrice != null) {
    params.set('min', String(filters.minPrice));
  }
  if (filters.maxPrice != null) {
    params.set('max', String(filters.maxPrice));
  }
  if (filters.sort !== 'name-asc') {
    params.set('sort', filters.sort);
  }
  const qs = params.toString();
  return qs ? `${path}?${qs}` : path;
}

export function filterProducts(
  products: Product[],
  filters: ShopFilters,
): Product[] {
  let list = products;
  const q = filters.q?.toLowerCase();

  if (q) {
    list = list.filter(
      (product) =>
        product.name.toLowerCase().includes(q) ||
        product.description.toLowerCase().includes(q) ||
        product.sku.toLowerCase().includes(q),
    );
  }
  if (filters.category) {
    list = list.filter((product) => product.category === filters.category);
  }
  if (filters.minPrice != null) {
    list = list.filter((product) => product.price >= filters.minPrice!);
  }
  if (filters.maxPrice != null) {
    list = list.filter((product) => product.price <= filters.maxPrice!);
  }

  const sorted = [...list];
  switch (filters.sort) {
    case 'price-asc':
      sorted.sort((a, b) => a.price - b.price);
      break;
    case 'price-desc':
      sorted.sort((a, b) => b.price - a.price);
      break;
    case 'name-desc':
      sorted.sort((a, b) => b.name.localeCompare(a.name));
      break;
    case 'newest':
      sorted.sort(
        (a, b) =>
          Date.parse(b.createdAt ?? '') - Date.parse(a.createdAt ?? ''),
      );
      break;
    default:
      sorted.sort((a, b) => a.name.localeCompare(b.name));
  }
  return sorted;
}

export function activeFilterCount(filters: ShopFilters): number {
  let count = 0;
  if (filters.q) {
    count += 1;
  }
  if (filters.category) {
    count += 1;
  }
  if (filters.minPrice != null) {
    count += 1;
  }
  if (filters.maxPrice != null) {
    count += 1;
  }
  if (filters.sort !== 'name-asc') {
    count += 1;
  }
  return count;
}

function parseCents(raw: string | null): number | undefined {
  if (!raw?.trim()) {
    return undefined;
  }
  const value = Number(raw);
  if (!Number.isFinite(value) || value < 0) {
    return undefined;
  }
  return Math.round(value);
}

function parseSort(raw: string | null): ShopSort {
  if (
    raw === 'price-asc' ||
    raw === 'price-desc' ||
    raw === 'name-desc' ||
    raw === 'newest'
  ) {
    return raw;
  }
  return 'name-asc';
}
