import { useEffect } from 'react';
import { Navigate, useParams, useSearchParams } from 'react-router-dom';
import { docId } from '@/api';
import { CategoryFilter, ProductCard } from '@/components';
import { EmptyState, Flash, PageHeader, ProductGrid } from '@/components/ui';
import { useCatalog } from '@/hooks';

export function ShopPage() {
  const { category: slug } = useParams<{ category?: string }>();
  const [params] = useSearchParams();
  const featuredOnly =
    params.get('featured') === '1' || params.get('featured') === 'true';
  const { products, categories, error, loadCatalog } = useCatalog();

  useEffect(() => {
    loadCatalog();
  }, [loadCatalog]);

  if (slug === 'featured' || (featuredOnly && slug)) {
    return <Navigate to="/shop?featured=1" replace />;
  }

  const category = slug
    ? categories.find((row) => row.slug === slug)
    : undefined;

  const list = products.filter((product) => {
    if (slug && product.category !== slug) {
      return false;
    }
    if (featuredOnly && !product.featured) {
      return false;
    }
    return true;
  });

  const title = featuredOnly
    ? 'Featured'
    : (category?.name ?? 'All products');

  const blurb = featuredOnly
    ? 'Picks with the featured flag. Each one still sits in a real category (Apparel, Shoes, …).'
    : (category?.blurb ?? 'The full catalog.');

  return (
    <>
      <PageHeader eyebrow="Shop" title={title} description={blurb}>
        <CategoryFilter
          categories={categories}
          active={slug}
          featured={featuredOnly}
        />
      </PageHeader>
      <Flash>{error}</Flash>
      {!error && list.length === 0 ? (
        <EmptyState>Nothing in this view yet.</EmptyState>
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
    </>
  );
}
