import { useNavigate } from 'react-router-dom';
import type { Category } from '@/api';
import { buildShopUrl, type ShopFilters as ShopFilterState } from '@/lib/shopFilters';
import { Card } from '@/components/ui';
import { ShopFiltersPanel } from './ShopFiltersPanel';

type Props = {
  categories: Category[];
  filters: ShopFilterState;
  className?: string;
};

export function ShopFilters({ categories, filters, className = '' }: Props) {
  const navigate = useNavigate();

  function apply(next: ShopFilterState) {
    navigate(buildShopUrl(next));
  }

  return (
    <Card padding="sm" className={`shop-filters-sidebar ${className}`.trim()}>
      <h2 className="shop-filters-heading mb-3">Filters</h2>
      <ShopFiltersPanel
        categories={categories}
        filters={filters}
        onApply={apply}
        onClear={() => navigate('/shop')}
        showSort={false}
      />
    </Card>
  );
}
