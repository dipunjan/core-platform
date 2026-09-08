import { useMemo } from 'react';
import { Navigate, useParams, useSearchParams } from 'react-router-dom';
import { docId } from '@/api';
import { ProductCard, ShopFilters } from '@/components';
import {
  EmptyState,
  Flash,
  PageHeader,
  PageLoader,
  ProductGrid,
  Spinner,
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

  if (slug === 'featured') {
    return <Navigate to="/shop" replace />;
  }

  const category = filters.category
    ? categories.find((row) => row.slug === filters.category)
    : undefined;
  const title = category?.name ?? (filters.q ? 'Search results' : 'All products');
  const blurb = qTooShort
    ? `Type at least ${SEARCH_MIN_CHARS} characters to search.`
    : filters.q
      ? `${products.length} result${products.length === 1 ? '' : 's'} for “${filters.q}”.`
      : (category?.blurb ?? 'Refine with category, price, or sort.');

  const initialLoad = loading && products.length === 0 && !qTooShort;

  if (initialLoad) {
    return <PageLoader label="Loading products…" />;
  }

  return (
    <>
      <PageHeader eyebrow="Shop" title={title} description={blurb} />
      <div className="row g-4">
        <div className="col-lg-auto">
          <ShopFilters
            categories={categories}
            filters={filters}
            resultCount={qTooShort ? 0 : products.length}
          />
        </div>
        <div className="col">
          <Flash>{error}</Flash>
          {loading && !qTooShort ? (
            <div className="mb-3">
              <Spinner label="Updating results…" size="sm" />
            </div>
          ) : null}
          {!error && !qTooShort && products.length === 0 ? (
            <EmptyState>
              {activeFilterCount(filters) > 0
                ? 'No products match these filters.'
                : 'Nothing in the catalog yet.'}
            </EmptyState>
          ) : qTooShort ? (
            <EmptyState>
              Keep typing — search starts after {SEARCH_MIN_CHARS} characters.
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
    </>
  );
}
