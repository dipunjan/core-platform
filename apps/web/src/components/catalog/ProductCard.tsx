import { useState } from 'react';
import { Link } from 'react-router-dom';
import { docId, type Category, type Product } from '@/api';
import { Button } from '@/components/ui';
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
  const category = categories.find((row) => row.slug === product.category);

  async function onAdd() {
    setBusy(true);
    await addItem(id, 1);
    setBusy(false);
  }

  return (
    <article className="group flex flex-col rounded-xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-700/30 hover:shadow-md">
      <Link to={`/products/${id}`} className="flex flex-1 flex-col">
        {category ? (
          <span className="text-xs font-semibold uppercase tracking-wide text-emerald-800">
            {category.name}
          </span>
        ) : null}
        {product.featured ? (
          <span className="mt-1 text-xs font-semibold uppercase tracking-wide text-zinc-400">
            Featured
          </span>
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
      <Button
        type="button"
        className="mt-4 w-full"
        disabled={busy || cartBusy}
        onClick={() => void onAdd()}
      >
        Add to cart
      </Button>
    </article>
  );
}
