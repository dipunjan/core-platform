import type { Category } from '@/api';
import {
  SHOP_SORT_OPTIONS,
  type ShopFilters,
} from '@/lib/shopFilters';

export type FilterChip = {
  id: string;
  label: string;
  next: ShopFilters;
};

export function buildFilterChips(
  filters: ShopFilters,
  categories: Category[],
  money: (cents: number) => string,
): FilterChip[] {
  const chips: FilterChip[] = [];

  if (filters.q) {
    chips.push({
      id: 'q',
      label: `Search: ${filters.q}`,
      next: { ...filters, q: undefined },
    });
  }

  if (filters.category) {
    const name =
      categories.find((row) => row.slug === filters.category)?.name ??
      filters.category;
    chips.push({
      id: 'category',
      label: name,
      next: { ...filters, category: undefined },
    });
  }

  if (filters.minPrice != null) {
    chips.push({
      id: 'minPrice',
      label: `Min ${money(filters.minPrice)}`,
      next: { ...filters, minPrice: undefined },
    });
  }

  if (filters.maxPrice != null) {
    chips.push({
      id: 'maxPrice',
      label: `Max ${money(filters.maxPrice)}`,
      next: { ...filters, maxPrice: undefined },
    });
  }

  if (filters.sort !== 'name-asc') {
    const sortLabel =
      SHOP_SORT_OPTIONS.find((row) => row.value === filters.sort)?.label ??
      filters.sort;
    chips.push({
      id: 'sort',
      label: sortLabel,
      next: { ...filters, sort: 'name-asc' },
    });
  }

  return chips;
}
