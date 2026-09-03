import { Link } from 'react-router-dom';
import { docId, money, type Product } from '@/api';

type Props = {
  product: Product;
};

export function ProductCard({ product }: Props) {
  const id = docId(product);
  return (
    <Link className="card" to={`/products/${id}`}>
      <strong>{product.name}</strong>
      <p className="muted">{product.description}</p>
      <p>{money(product.price)}</p>
    </Link>
  );
}
