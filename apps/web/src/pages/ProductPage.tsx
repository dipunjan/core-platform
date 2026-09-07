import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  Badge,
  Button,
  Card,
  Flash,
  Spinner,
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
  const category = categories.find((row) => row.slug === product.category);

  return (
    <div className="mx-auto max-w-2xl">
      <p className="mb-4">
        <TextLink to="/shop">← Shop</TextLink>
      </p>
      <Card padding="lg">
        {category ? (
          <Link to={`/shop/${product.category}`}>
            <Badge>{category.name}</Badge>
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
      </Card>
    </div>
  );
}
