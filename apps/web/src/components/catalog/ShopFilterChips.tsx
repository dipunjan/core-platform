import { useNavigate } from 'react-router-dom';
import type { Category } from '@/api';
import { buildFilterChips } from '@/lib/shopFilterChips';
import { buildShopUrl, type ShopFilters } from '@/lib/shopFilters';
import { useMoney } from '@/hooks';

type Props = {
  filters: ShopFilters;
  categories: Category[];
};

export function ShopFilterChips({ filters, categories }: Props) {
  const navigate = useNavigate();
  const money = useMoney();
  const chips = buildFilterChips(filters, categories, money);

  if (chips.length === 0) {
    return null;
  }

  return (
    <div className="shop-filter-chips d-flex flex-wrap align-items-center gap-2 mb-3">
      {chips.map((chip) => (
        <button
          key={chip.id}
          type="button"
          className="shop-filter-chip"
          onClick={() => navigate(buildShopUrl(chip.next))}
        >
          <span>{chip.label}</span>
          <span className="shop-filter-chip-x" aria-hidden="true">×</span>
        </button>
      ))}
      <button
        type="button"
        className="btn btn-link btn-sm shop-filter-clear p-0"
        onClick={() => navigate('/shop')}
      >
        Clear all
      </button>
    </div>
  );
}
