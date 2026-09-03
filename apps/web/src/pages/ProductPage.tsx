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
    <div className="mx-auto max-w-2xl">
      <p className="mb-4">
        <Link
          className="text-sm font-medium text-emerald-800 hover:underline"
          to="/"
        >
          ← Products
        </Link>
      </p>
      <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
          {product.name}
        </h1>
        <p className="mt-3 text-zinc-600">{product.description}</p>
        <p className="mt-4">
          <strong className="text-2xl font-semibold tabular-nums">
            {money(product.price)}
          </strong>
          <span className="ml-2 text-sm text-zinc-500">SKU {product.sku}</span>
        </p>
        <p className="mt-2 text-sm text-zinc-500">
          {inventory
            ? `${available} in stock (${inventory.reserved} reserved)`
            : 'Stock not available yet (start inventory-service, then create the product again).'}
        </p>
        <div className="mt-6">
          <Flash>{cartError}</Flash>
          <Button type="button" disabled={cartBusy} onClick={() => void onAdd()}>
            {user ? 'Add to cart' : 'Log in to add'}
          </Button>
        </div>
      </div>
    </div>
  );
}
