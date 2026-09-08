import { useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { docId } from '@/api';
import { ProductCard, ShopFilterChips, ShopFilters, ShopFiltersPanel } from '@/components';
import {
  Button,
  EmptyState,
  Flash,
  PageHeader,
  PageLoader,
  ProductGrid,
  SelectField,
} from '@/components/ui';
import {
  activeFilterCount,
  buildShopUrl,
  parseShopFilters,
  SHOP_SORT_OPTIONS,
} from '@/lib/shopFilters';
import { SEARCH_MIN_CHARS } from '@/lib/search';
import { useShop } from '@/hooks/useShop';

export function ShopPage() {
  const navigate = useNavigate();
  const { category: slug } = useParams<{ category?: string }>();
  const [searchParams] = useSearchParams();
  const filters = useMemo(
    () => parseShopFilters(slug, searchParams.toString()),
    [slug, searchParams],
  );
  const { products, categories, error, loading, qTooShort } = useShop(filters);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (!loading) {
      setHydrated(true);
    }
  }, [loading]);

  if (slug === 'featured') {
    return <Navigate to="/shop" replace />;
  }

  const category = filters.category
    ? categories.find((row) => row.slug === filters.category)
    : undefined;
  const title = category?.name ?? (filters.q ? 'Search results' : 'All products');

  let blurb: string | undefined;
  if (qTooShort) {
    blurb = `Type at least ${SEARCH_MIN_CHARS} characters to search.`;
  } else if (filters.q) {
    blurb = loading
      ? `Searching for “${filters.q}”…`
      : `${products.length} result${products.length === 1 ? '' : 's'} for “${filters.q}”.`;
  } else {
    blurb = category?.blurb;
  }

  const initialLoad = !hydrated && products.length === 0;

  if (initialLoad) {
    return <PageLoader label="Loading products…" />;
  }

  const showEmpty =
    !error && !loading && !qTooShort && products.length === 0;
  const filterCount = activeFilterCount(filters);

  function applyFilters(next: typeof filters) {
    navigate(buildShopUrl(next));
  }

  return (
    <>
      <PageHeader eyebrow="Shop" title={title} description={blurb} />

      <div className="shop-toolbar d-flex flex-wrap align-items-center justify-content-between gap-3 mb-3">
        <p className="shop-result-count mb-0">
          {qTooShort ? '—' : `${products.length} items`}
        </p>
        <div className="d-flex flex-wrap align-items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            className="d-lg-none"
            data-bs-toggle="offcanvas"
            data-bs-target="#shop-filters-drawer"
          >
            Filters{filterCount > 0 ? ` (${filterCount})` : ''}
          </Button>
          <div className="shop-toolbar-sort">
            <SelectField
              label="Sort"
              labelClassName="shop-toolbar-sort-label"
              className="mb-0 shop-toolbar-sort-field"
              value={filters.sort}
              onChange={(event) => {
                applyFilters({
                  ...filters,
                  sort: event.target.value as typeof filters.sort,
                });
              }}
            >
              {SHOP_SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </SelectField>
          </div>
        </div>
      </div>

      <ShopFilterChips filters={filters} categories={categories} />

      <div className="row g-4">
        <div className="col-lg-3 d-none d-lg-block">
          <ShopFilters categories={categories} filters={filters} />
        </div>
        <div className="col-lg-9">
          <Flash>{error}</Flash>
          <div
            className={loading && !qTooShort ? 'shop-results-loading' : undefined}
            aria-busy={loading && !qTooShort ? true : undefined}
          >
            {showEmpty ? (
              <EmptyState>
                {filterCount > 0
                  ? 'No products match these filters.'
                  : 'Nothing in the catalog yet.'}
              </EmptyState>
            ) : (
              <ProductGrid>
                {products.map((product) => (
                  <ProductCard
                    key={docId(product)}
                    product={product}
                    categories={categories}
                  />
                ))}
              </ProductGrid>
            )}
          </div>
        </div>
      </div>

      <div
        className="offcanvas offcanvas-start shop-filters-drawer"
        tabIndex={-1}
        id="shop-filters-drawer"
        aria-labelledby="shop-filters-drawer-label"
      >
        <div className="offcanvas-header border-bottom">
          <h2 className="offcanvas-title h6 mb-0" id="shop-filters-drawer-label">
            Filters
          </h2>
          <button
            type="button"
            className="btn-close"
            data-bs-dismiss="offcanvas"
            aria-label="Close"
          />
        </div>
        <div className="offcanvas-body">
          <ShopFiltersPanel
            categories={categories}
            filters={filters}
            onApply={applyFilters}
            onClear={() => navigate('/shop')}
          />
        </div>
      </div>
    </>
  );
}
