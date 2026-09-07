import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Category } from '@/api';
import {
  buildShopUrl,
  SHOP_SORT_OPTIONS,
  type ShopFilters as ShopFilterState,
} from '@/lib/shopFilters';
import { Button, Card, Field, SelectField } from '@/components/ui';

type Props = {
  categories: Category[];
  filters: ShopFilterState;
  resultCount: number;
};

function majorUnits(cents: number | undefined) {
  if (cents == null) {
    return '';
  }
  return String(cents / 100);
}

function toCents(raw: string): number | undefined {
  const trimmed = raw.trim();
  if (!trimmed) {
    return undefined;
  }
  const value = Number(trimmed);
  if (!Number.isFinite(value) || value < 0) {
    return undefined;
  }
  return Math.round(value * 100);
}

export function ShopFilters({ categories, filters, resultCount }: Props) {
  const navigate = useNavigate();
  const [minDraft, setMinDraft] = useState(() => majorUnits(filters.minPrice));
  const [maxDraft, setMaxDraft] = useState(() => majorUnits(filters.maxPrice));

  useEffect(() => {
    setMinDraft(majorUnits(filters.minPrice));
    setMaxDraft(majorUnits(filters.maxPrice));
  }, [filters.minPrice, filters.maxPrice]);

  function apply(next: ShopFilterState) {
    navigate(buildShopUrl(next));
  }

  return (
    <Card padding="sm" className="h-fit lg:sticky lg:top-36">
      <div className="mb-4 flex items-baseline justify-between gap-2">
        <h2 className="text-sm font-semibold text-zinc-900">Filters</h2>
        <span className="text-xs text-zinc-500">{resultCount} items</span>
      </div>

      <SelectField
        label="Category"
        value={filters.category ?? ''}
        onChange={(event) => {
          const category = event.target.value || undefined;
          apply({ ...filters, category });
        }}
      >
        <option value="">All categories</option>
        {categories.map((category) => (
          <option key={category.slug} value={category.slug}>
            {category.name}
          </option>
        ))}
      </SelectField>

      <Field
        label="Min price"
        type="number"
        min={0}
        step={0.01}
        placeholder="0"
        value={minDraft}
        onChange={(event) => setMinDraft(event.target.value)}
        onBlur={() => {
          apply({ ...filters, minPrice: toCents(minDraft) });
        }}
      />

      <Field
        label="Max price"
        type="number"
        min={0}
        step={0.01}
        placeholder="Any"
        value={maxDraft}
        onChange={(event) => setMaxDraft(event.target.value)}
        onBlur={() => {
          apply({ ...filters, maxPrice: toCents(maxDraft) });
        }}
      />

      <SelectField
        label="Sort by"
        value={filters.sort}
        onChange={(event) => {
          apply({
            ...filters,
            sort: event.target.value as ShopFilterState['sort'],
          });
        }}
      >
        {SHOP_SORT_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </SelectField>

      <Button
        type="button"
        variant="secondary"
        className="w-full"
        onClick={() => navigate('/shop')}
      >
        Clear filters
      </Button>
    </Card>
  );
}
