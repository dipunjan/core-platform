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
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {tiles.map((category) => (
        <Card
          key={category.slug}
          as={Link}
          to={shopPath(category)}
          padding="sm"
          variant="interactive"
          className="block hover:border-emerald-700/40"
        >
          <strong className="text-zinc-950">{category.name}</strong>
          <p className="mt-1 text-sm text-zinc-500">{category.blurb}</p>
        </Card>
      ))}
    </div>
  );
}
