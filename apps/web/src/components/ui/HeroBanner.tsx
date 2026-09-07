import { Link } from 'react-router-dom';
import { shopPath, type Category, type HeroBanner as HeroData } from '@/api';
import { brandImage } from '@/lib/brandImage';
import { Button } from './Button';

type HeroBannerProps = {
  hero?: HeroData;
  eyebrow: string;
  homeCategory?: Category;
};

export function HeroBanner({ hero, eyebrow, homeCategory }: HeroBannerProps) {
  return (
    <section
      className="overflow-hidden rounded-2xl bg-zinc-950 px-6 py-14 text-white sm:px-10 sm:py-20"
      style={{
        backgroundImage: `linear-gradient(rgba(9,9,11,.72), rgba(9,9,11,.72)), url(${brandImage(hero?.imageUrl, 'hero')})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-400">
        {eyebrow}
      </p>
      <h1 className="mt-3 max-w-xl text-4xl font-semibold tracking-tight sm:text-5xl">
        {hero?.headline || 'The drop is live. Grab it before it isn’t.'}
      </h1>
      <p className="mt-4 max-w-lg text-zinc-300">
        {hero?.sub ||
          'Browse the catalog. Log in when you want to bag something.'}
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link to={hero?.href || '/shop'}>
          <Button variant="light" className="px-5 py-2.5">
            {hero?.cta || 'Shop all'}
          </Button>
        </Link>
        {homeCategory ? (
          <Link to={shopPath(homeCategory)}>
            <Button variant="onDark" className="px-5 py-2.5">
              Shop {homeCategory.name.toLowerCase()}
            </Button>
          </Link>
        ) : null}
      </div>
    </section>
  );
}
