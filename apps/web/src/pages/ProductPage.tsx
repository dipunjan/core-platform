import { Link, useParams } from 'react-router-dom';
import {
  Badge,
  EmptyState,
  Flash,
  PageLoader,
  PageTitle,
  TextLink,
} from '@/components';
import { AddToCart } from '@/components/catalog';
import { categoryAccent, categoryInitial } from '@/lib/categoryAccent';
import { useCart, useMoney, useProduct } from '@/hooks';

export function ProductPage() {
  const { id } = useParams<{ id: string }>();
  const { product, inventory, categories, error, loading } = useProduct(id);
  const { error: cartError } = useCart();
  const money = useMoney();

  if (error && !product) {
    return (
      <>
        <PageTitle className="mb-3">Product</PageTitle>
        <Flash>{error}</Flash>
        <EmptyState>
          This product is not available.{' '}
          <TextLink to="/shop">Back to shop</TextLink>
        </EmptyState>
      </>
    );
  }
  if (loading || !product) {
    return <PageLoader label="Loading product…" />;
  }

  const available = inventory
    ? Math.max(0, inventory.quantity - inventory.reserved)
    : null;
  const outOfStock = available === 0;
  const category = categories.find((row) => row.slug === product.category);
  const accent = categoryAccent(product.category);
  const initial = categoryInitial(category?.name ?? product.name);

  return (
    <article className="product-detail mx-auto">
      <p className="mb-4">
        <TextLink to="/shop">← Back to shop</TextLink>
      </p>
      <div className="row g-4 align-items-start">
        <div className="col-md-5">
          <div
            className="product-detail-thumb"
            style={{
              background: `linear-gradient(135deg, ${accent} 0%, color-mix(in srgb, ${accent} 70%, #000) 100%)`,
            }}
          >
            <span className="product-detail-initial" aria-hidden="true">
              {initial}
            </span>
          </div>
        </div>
        <div className="col-md-7">
          <div className="product-detail-body">
            {category ? (
              <Link to={`/shop/${product.category}`} className="text-decoration-none">
                <Badge>{category.name}</Badge>
              </Link>
            ) : null}
            <h1 className="section-title mt-2 mb-0">{product.name}</h1>
            <p className="product-detail-price mt-3 mb-0">{money(product.price)}</p>
            <p className="text-muted small mb-0 mt-1">SKU {product.sku}</p>
            <p className="product-detail-description mt-4 mb-0">
              {product.description}
            </p>
            <p className="mt-3 mb-0">
              <span
                className={`badge ${outOfStock ? 'text-bg-secondary' : 'text-bg-success'}`}
              >
                {inventory
                  ? outOfStock
                    ? 'Out of stock'
                    : `${available} in stock`
                  : 'Stock unknown'}
              </span>
            </p>
            <div className="product-detail-actions mt-4">
              <Flash>{cartError}</Flash>
              {id ? (
                <AddToCart productId={id} disabled={outOfStock} />
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
