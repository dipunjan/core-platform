import { useEffect } from 'react';
import { Navigate, useParams, useSearchParams } from 'react-router-dom';
import { docId } from '@/api';
import { ProductCard, ShopFilters } from '@/components';
import { EmptyState, Flash, PageHeader, ProductGrid } from '@/components/ui';
import { activeFilterCount, filterProducts, parseShopFilters } from '@/lib/shopFilters';
import { useCatalog } from '@/hooks';

export function ShopPage() {
  const { category: slug } = useParams<{ category?: string }>();
  const [searchParams] = useSearchParams();
  const { products, categories, error, loadCatalog } = useCatalog();

  useEffect(() => {
    loadCatalog();
  }, [loadCatalog]);

  if (slug === 'featured') {
    return <Navigate to="/shop" replace />;
  }

  const filters = parseShopFilters(slug, searchParams.toString());
  const category = filters.category
    ? categories.find((row) => row.slug === filters.category)
    : undefined;
  const list = filterProducts(products, filters);
  const title = category?.name ?? (filters.q ? 'Search results' : 'All products');
  const blurb = filters.q
    ? `Showing matches for “${filters.q}”.`
    : (category?.blurb ?? 'Search, filter by category or price, and sort below.');

  return (
    <>
      <PageHeader eyebrow="Shop" title={title} description={blurb} />
      <div className="grid gap-8 lg:grid-cols-[15rem_1fr]">
        <ShopFilters
          categories={categories}
          filters={filters}
          resultCount={list.length}
        />
        <div>
          <Flash>{error}</Flash>
          {!error && list.length === 0 ? (
            <EmptyState>
              {activeFilterCount(filters) > 0
                ? 'No products match these filters.'
                : 'Nothing in the catalog yet.'}
            </EmptyState>
          ) : (
            <ProductGrid>
              {list.map((product) => (
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
