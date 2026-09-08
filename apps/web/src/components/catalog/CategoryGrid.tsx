import { Link } from 'react-router-dom';
import { shopPath, type Category } from '@/api';
import { Card, EmptyState } from '@/components/ui';

type Props = {
  categories: Category[];
  loading?: boolean;
};

export function CategoryGrid({ categories, loading = false }: Props) {
  const tiles = categories.filter((category) => category.showOnHome);
  if (loading && tiles.length === 0) {
    return null;
  }
  if (tiles.length === 0) {
    return (
      <EmptyState>
        No categories on the home page yet. Staff can add them in admin.
      </EmptyState>
    );
  }
  return (
    <div className="row row-cols-1 row-cols-sm-2 row-cols-lg-5 g-3">
      {tiles.map((category) => (
        <div key={category.slug} className="col">
          <Card
            as={Link}
            to={shopPath(category)}
            padding="sm"
            variant="interactive"
            className="text-decoration-none text-body h-100"
          >
            <strong>{category.name}</strong>
            <p className="mt-1 mb-0 text-muted small">{category.blurb}</p>
          </Card>
        </div>
      ))}
    </div>
  );
}
