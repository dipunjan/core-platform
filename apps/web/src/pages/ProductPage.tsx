import { Link, useNavigate, useParams } from 'react-router-dom';
import { Button, Flash, Spinner } from '@/components';
import { useCart, useMoney, useProduct } from '@/hooks';

export function ProductPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { product, inventory, categories, error, loading } = useProduct(id);
  const { addItem, loading: cartBusy, error: cartError } = useCart();
  const money = useMoney();

  async function onAdd() {
    if (!id) {
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
          to="/shop"
        >
          ← Shop
        </Link>
      </p>
      <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
        {categories.find((row) => row.slug === product.category) ? (
          <Link
            to={`/shop/${product.category}`}
            className="text-xs font-semibold uppercase tracking-wide text-emerald-800 hover:underline"
          >
            {categories.find((row) => row.slug === product.category)?.name}
          </Link>
        ) : null}
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-zinc-900">
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
            Add to cart
          </Button>
        </div>
      </div>
    </div>
  );
}
