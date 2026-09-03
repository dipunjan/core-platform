import { useEffect } from 'react';
import { docId } from '@/api';
import { EmptyState, Flash, ProductCard } from '@/components';
import { useCatalog } from '@/hooks';

export function HomePage() {
  const { products, error, loadProducts } = useCatalog();

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
          The drop
        </h1>
        <p className="mt-2 text-sm text-zinc-500">
          Browse anything. Log in when you want to bag it.
        </p>
      </div>
      <Flash>{error}</Flash>
      {!error && products.length === 0 ? (
        <EmptyState>
          No products yet. Create one with Postman, then refresh.
        </EmptyState>
      ) : null}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => (
          <ProductCard key={docId(product)} product={product} />
        ))}
      </div>
    </>
  );
}
