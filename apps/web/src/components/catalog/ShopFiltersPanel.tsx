import { useEffect, useState } from 'react';
import type { Category } from '@/api';
import {
  SHOP_SORT_OPTIONS,
  type ShopFilters as ShopFilterState,
} from '@/lib/shopFilters';
import { Button, Field, SelectField } from '@/components/ui';

type Props = {
  categories: Category[];
  filters: ShopFilterState;
  onApply: (next: ShopFilterState) => void;
  onClear: () => void;
  showSort?: boolean;
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

export function ShopFiltersPanel({
  categories,
  filters,
  onApply,
  onClear,
  showSort = true,
}: Props) {
  const [minDraft, setMinDraft] = useState(() => majorUnits(filters.minPrice));
  const [maxDraft, setMaxDraft] = useState(() => majorUnits(filters.maxPrice));

  useEffect(() => {
    setMinDraft(majorUnits(filters.minPrice));
    setMaxDraft(majorUnits(filters.maxPrice));
  }, [filters.minPrice, filters.maxPrice]);

  return (
    <>
      <SelectField
        label="Category"
        value={filters.category ?? ''}
        onChange={(event) => {
          const category = event.target.value || undefined;
          onApply({ ...filters, category });
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
          onApply({ ...filters, minPrice: toCents(minDraft) });
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
          onApply({ ...filters, maxPrice: toCents(maxDraft) });
        }}
      />

      {showSort ? (
        <SelectField
          label="Sort by"
          value={filters.sort}
          onChange={(event) => {
            onApply({
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
      ) : null}

      <Button type="button" variant="secondary" className="w-100" onClick={onClear}>
        Clear all
      </Button>
    </>
  );
}
