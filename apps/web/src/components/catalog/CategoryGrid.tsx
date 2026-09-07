import { Link } from 'react-router-dom';
import { shopPath, type Category } from '@/api';

type Props = {
  categories: Category[];
};

export function CategoryGrid({ categories }: Props) {
  const tiles = categories.filter((category) => category.showOnHome);
  if (tiles.length === 0) {
    return null;
  }
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {tiles.map((category) => (
        <Link
          key={category.slug}
          to={shopPath(category)}
          className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-700/40 hover:shadow-md"
        >
          <strong className="text-zinc-950">{category.name}</strong>
          <p className="mt-1 text-sm text-zinc-500">{category.blurb}</p>
        </Link>
      ))}
    </div>
  );
}
