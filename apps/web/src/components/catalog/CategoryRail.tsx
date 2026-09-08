import { Link } from 'react-router-dom';
import { shopPath, type Category } from '@/api';
import { categoryAccent, categoryInitial } from '@/lib/categoryAccent';

type Props = {
  categories: Category[];
};

export function CategoryRail({ categories }: Props) {
  const tiles = categories.filter((category) => category.showOnHome);
  if (tiles.length === 0) {
    return null;
  }

  return (
    <div className="category-rail">
      <div className="category-rail-track">
        {tiles.map((category) => {
          const accent = categoryAccent(category.slug);
          const initial = categoryInitial(category.name);
          return (
            <Link
              key={category.slug}
              to={shopPath(category)}
              className="category-rail-item text-decoration-none text-body"
            >
              <span
                className="category-rail-icon"
                style={{
                  background: `linear-gradient(135deg, ${accent} 0%, color-mix(in srgb, ${accent} 72%, #000) 100%)`,
                }}
              >
                {initial}
              </span>
              <span className="category-rail-label">{category.name}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
