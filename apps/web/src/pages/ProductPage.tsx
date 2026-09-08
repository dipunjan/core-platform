import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Flash,
  PageLoader,
  PageTitle,
  TextLink,
} from '@/components';
import { useCart, useMoney, useProduct } from '@/hooks';

export function ProductPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { product, inventory, categories, error, loading } = useProduct(id);
  const { addItem, loading: cartBusy, error: cartError } = useCart();
  const money = useMoney();

  async function onAdd() {
    if (!id || outOfStock) {
      return;
    }
    if (await addItem(id, 1)) {
      navigate('/cart');
    }
  }

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

  return (
    <div className="mx-auto" style={{ maxWidth: '42rem' }}>
      <p className="mb-3">
        <TextLink to="/shop">← Shop</TextLink>
      </p>
      <Card padding="lg">
        {category ? (
          <Link to={`/shop/${product.category}`} className="text-decoration-none">
            <Badge>{category.name}</Badge>
          </Link>
        ) : null}
        <h1 className="h2 fw-semibold mt-1">{product.name}</h1>
        <p className="mt-3 text-muted mb-0">{product.description}</p>
        <p className="mt-3 mb-0">
          <strong className="fs-4 fw-semibold font-monospace">
            {money(product.price)}
          </strong>
          <span className="ms-2 text-muted small">SKU {product.sku}</span>
        </p>
        <p className="mt-2 text-muted small mb-0">
          {inventory
            ? outOfStock
              ? 'Out of stock'
              : `${available} in stock`
            : 'Stock check unavailable — you can still try adding to cart.'}
        </p>
        <div className="mt-4">
          <Flash>{cartError}</Flash>
          <Button
            type="button"
            loading={cartBusy}
            loadingLabel="Adding…"
            disabled={outOfStock}
            onClick={() => void onAdd()}
          >
            {outOfStock ? 'Out of stock' : 'Add to cart'}
          </Button>
        </div>
      </Card>
    </div>
  );
}
