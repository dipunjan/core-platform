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
      <h1>Products</h1>
      <p className="muted">Anyone can browse. Log in to add items to a cart.</p>
      <Flash>{error}</Flash>
      {!error && products.length === 0 ? (
        <EmptyState>No products yet. Create one with Postman, then refresh.</EmptyState>
      ) : null}
      <div className="grid">
        {products.map((product) => (
          <ProductCard key={docId(product)} product={product} />
        ))}
      </div>
    </>
  );
}
