import { Link, useNavigate, useParams } from 'react-router-dom';
import { money } from '@/api';
import { Button, Flash, Spinner } from '@/components';
import { useAuth, useCart, useProduct } from '@/hooks';

export function ProductPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { product, inventory, error, loading } = useProduct(id);
  const { addItem, loading: cartBusy, error: cartError } = useCart();

  async function onAdd() {
    if (!id) {
      return;
    }
    if (!user) {
      navigate('/login');
      return;
    }
    if (await addItem(id, 1)) {
      navigate('/cart');
    }
  }

  if (error && !product) {
    return <Flash>{error}</Flash>;
  }
  if (loading || !product) {
    return <Spinner />;
  }

  const available = inventory
    ? Math.max(0, inventory.quantity - inventory.reserved)
    : null;

  return (
    <>
      <p>
        <Link to="/">← Products</Link>
      </p>
      <div className="card">
        <h1>{product.name}</h1>
        <p>{product.description}</p>
        <p>
          <strong>{money(product.price)}</strong>
          <span className="muted"> · SKU {product.sku}</span>
        </p>
        <p className="muted">
          {inventory
            ? `${available} in stock (${inventory.reserved} reserved)`
            : 'Stock not available yet (start inventory-service, then create the product again).'}
        </p>
        <Flash>{cartError}</Flash>
        <Button type="button" disabled={cartBusy} onClick={() => void onAdd()}>
          {user ? 'Add to cart' : 'Log in to add'}
        </Button>
      </div>
    </>
  );
}
