import { useState } from 'react';
import { Link } from 'react-router-dom';
import { docId, type Category, type Product } from '@/api';
import { Badge, Button, Card, TextLink } from '@/components/ui';
import { useCart, useMoney } from '@/hooks';

type Props = {
  product: Product;
  categories: Category[];
};

export function ProductCard({ product, categories }: Props) {
  const money = useMoney();
  const id = docId(product);
  const { addItem, loading: cartBusy } = useCart();
  const [busy, setBusy] = useState(false);
  const [added, setAdded] = useState(false);
  const category = categories.find((row) => row.slug === product.category);

  async function onAdd() {
    setBusy(true);
    const ok = await addItem(id, 1);
    setBusy(false);
    if (ok) {
      setAdded(true);
      window.setTimeout(() => setAdded(false), 2500);
    }
  }

  return (
    <Card padding="md" variant="interactive" className="group flex flex-col">
      <Link to={`/products/${id}`} className="flex flex-1 flex-col">
        {category ? <Badge>{category.name}</Badge> : null}
        {product.featured ? (
          <Badge tone="muted" className="mt-1">Featured</Badge>
        ) : null}
        <strong className="mt-1 text-base font-semibold text-zinc-900 group-hover:text-emerald-800">
          {product.name}
        </strong>
        <p className="mt-2 line-clamp-3 flex-1 text-sm text-zinc-500">
          {product.description}
        </p>
        <p className="mt-4 text-lg font-semibold tracking-tight text-zinc-900">
          {money(product.price)}
        </p>
      </Link>
      {added ? (
        <p className="mt-4 text-center text-sm font-medium text-emerald-800">
          Added to cart. <TextLink to="/cart">View cart</TextLink>
        </p>
      ) : (
        <Button
          type="button"
          className="mt-4 w-full"
          loading={busy || cartBusy}
          loadingLabel="Adding…"
          onClick={() => void onAdd()}
        >
          Add to cart
        </Button>
      )}
    </Card>
  );
}
