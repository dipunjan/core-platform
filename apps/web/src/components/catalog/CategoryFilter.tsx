import { Link } from 'react-router-dom';
import { shopPath, type Category } from '@/api';

type Props = {
  categories: Category[];
  active?: string;
  featured?: boolean;
};

export function CategoryFilter({ categories, active, featured }: Props) {
  const chip = (on: boolean) =>
    `rounded-full px-3.5 py-1.5 text-sm font-semibold transition ${
      on
        ? 'bg-zinc-950 text-white'
        : 'bg-white text-zinc-700 ring-1 ring-zinc-200 hover:ring-zinc-400'
    }`;

  const nav = categories.filter((category) => category.showInNav);

  return (
    <div className="flex flex-wrap gap-2">
      <Link to="/shop" className={chip(!active && !featured)}>
        All
      </Link>
      {nav.map((category) => (
        <Link
          key={category.slug}
          to={shopPath(category)}
          className={chip(!featured && active === category.slug)}
        >
          {category.name}
        </Link>
      ))}
      <Link to="/shop?featured=1" className={chip(Boolean(featured) && !active)}>
        Featured
      </Link>
    </div>
  );
}
