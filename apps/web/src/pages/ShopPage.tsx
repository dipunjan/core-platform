import { useEffect, useMemo, useState } from 'react';
import { Navigate, useParams, useSearchParams } from 'react-router-dom';
import { docId } from '@/api';
import { ProductCard, ShopFilters } from '@/components';
import {
  EmptyState,
  Flash,
  PageHeader,
  PageLoader,
  ProductGrid,
} from '@/components/ui';
import { activeFilterCount, parseShopFilters } from '@/lib/shopFilters';
import { SEARCH_MIN_CHARS } from '@/lib/search';
import { useShop } from '@/hooks/useShop';

export function ShopPage() {
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

  let blurb = category?.blurb ?? 'Refine with category, price, or sort.';
  if (qTooShort) {
    blurb = `Type at least ${SEARCH_MIN_CHARS} characters to search.`;
  } else if (filters.q) {
    blurb = loading
      ? `Searching for “${filters.q}”…`
      : `${products.length} result${products.length === 1 ? '' : 's'} for “${filters.q}”.`;
  }

  const initialLoad = !hydrated && products.length === 0;

  if (initialLoad) {
    return <PageLoader label="Loading products…" />;
  }

  const showEmpty =
    !error && !loading && !qTooShort && products.length === 0;

  return (
    <>
      <PageHeader eyebrow="Shop" title={title} description={blurb} />
      <div className="row g-4">
        <div className="col-lg-auto">
          <ShopFilters
            categories={categories}
            filters={filters}
            resultCount={products.length}
          />
        </div>
        <div className="col">
          <Flash>{error}</Flash>
          <div
            className={loading && !qTooShort ? 'shop-results-loading' : undefined}
            aria-busy={loading && !qTooShort ? true : undefined}
          >
            {showEmpty ? (
              <EmptyState>
                {activeFilterCount(filters) > 0
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
    </>
  );
}
