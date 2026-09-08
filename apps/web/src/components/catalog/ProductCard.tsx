import { Link } from 'react-router-dom';
import { docId, type Category, type Product } from '@/api';
import { AddToCart } from './AddToCart';
import { categoryAccent, categoryInitial } from '@/lib/categoryAccent';
import { Badge } from '@/components/ui';
import { useMoney } from '@/hooks';

type Props = {
  product: Product;
  categories: Category[];
};

export function ProductCard({ product, categories }: Props) {
  const money = useMoney();
  const id = docId(product);
  const category = categories.find((row) => row.slug === product.category);
  const accent = categoryAccent(product.category);
  const initial = categoryInitial(category?.name ?? product.name);

  return (
    <div className="card w-100 product-card card-hover overflow-hidden d-flex flex-column">
      <Link to={`/products/${id}`} className="text-decoration-none text-body">
        <div
          className="product-card-thumb"
          style={{
            background: `linear-gradient(135deg, ${accent} 0%, color-mix(in srgb, ${accent} 75%, #000) 100%)`,
          }}
        >
          <span aria-hidden="true">{initial}</span>
        </div>
      </Link>
      <div className="card-body p-4 d-flex flex-column flex-grow-1">
        <Link
          to={`/products/${id}`}
          className="text-decoration-none text-body d-flex flex-column flex-grow-1"
        >
          <div className="d-flex flex-wrap gap-1">
            {category ? <Badge>{category.name}</Badge> : null}
            {product.featured ? <Badge tone="muted">Featured</Badge> : null}
          </div>
          <strong className="mt-2 fw-semibold product-card-title">
            {product.name}
          </strong>
          <p className="mt-2 mb-0 text-muted small product-card-description">
            {product.description}
          </p>
          <p className="mt-3 fs-5 fw-bold mb-0">{money(product.price)}</p>
        </Link>
        <div className="mt-auto pt-3">
          <AddToCart productId={id} block />
        </div>
      </div>
    </div>
  );
}
