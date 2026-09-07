import { useEffect } from 'react';
import { Navigate, useParams, useSearchParams } from 'react-router-dom';
import { docId } from '@/api';
import { CategoryFilter, ProductCard } from '@/components';
import { EmptyState, Flash } from '@/components/ui';
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
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-800">
          Shop
        </p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-zinc-900">
          {title}
        </h1>
        <p className="mt-2 text-sm text-zinc-500">{blurb}</p>
        <div className="mt-6">
          <CategoryFilter
            categories={categories}
            active={slug}
            featured={featuredOnly}
          />
        </div>
      </div>
      <Flash>{error}</Flash>
      {!error && list.length === 0 ? (
        <EmptyState>Nothing in this view yet.</EmptyState>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((product) => (
            <ProductCard
              key={docId(product)}
              product={product}
              categories={categories}
            />
          ))}
        </div>
      )}
    </>
  );
}
