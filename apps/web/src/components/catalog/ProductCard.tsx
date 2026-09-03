import { Link } from 'react-router-dom';
import { docId, money, type Product } from '@/api';

type Props = {
  product: Product;
};

export function ProductCard({ product }: Props) {
  const id = docId(product);
  return (
    <Link
      className="group flex flex-col rounded-xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-700/30 hover:shadow-md"
      to={`/products/${id}`}
    >
      <strong className="text-base font-semibold text-zinc-900 group-hover:text-emerald-800">
        {product.name}
      </strong>
      <p className="mt-2 line-clamp-3 flex-1 text-sm text-zinc-500">
        {product.description}
      </p>
      <p className="mt-4 text-lg font-semibold tracking-tight text-zinc-900">
        {money(product.price)}
      </p>
    </Link>
  );
}
