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
    <Card
      padding="md"
      variant="interactive"
      className="h-100 product-card"
    >
      <Link to={`/products/${id}`} className="text-decoration-none text-body d-flex flex-column flex-grow-1">
        {category ? <Badge>{category.name}</Badge> : null}
        {product.featured ? (
          <Badge tone="muted" className="mt-1">Featured</Badge>
        ) : null}
        <strong className="mt-1 fw-semibold product-card-title">
          {product.name}
        </strong>
        <p className="mt-2 line-clamp-3 flex-grow-1 text-muted small mb-0">
          {product.description}
        </p>
        <p className="mt-3 fs-5 fw-semibold mb-0">
          {money(product.price)}
        </p>
      </Link>
      {added ? (
        <p className="mt-3 mb-0 text-center small fw-medium text-primary">
          Added to cart. <TextLink to="/cart">View cart</TextLink>
        </p>
      ) : (
        <Button
          type="button"
          className="mt-3 w-100"
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
