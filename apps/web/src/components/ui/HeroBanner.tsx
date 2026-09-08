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
      className="overflow-hidden rounded-4 text-white px-4 px-sm-5 py-5 py-sm-6"
      style={{
        backgroundImage: `linear-gradient(rgba(9,9,11,.72), rgba(9,9,11,.72)), url(${brandImage(hero?.imageUrl, 'hero')})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <p className="small fw-semibold text-uppercase text-accent mb-0">
        {eyebrow}
      </p>
      <h1 className="display-5 fw-semibold mt-3 hero-headline">
        {hero?.headline || 'The drop is live. Grab it before it isn’t.'}
      </h1>
      <p className="text-white-50 mt-3 hero-subhead mb-0">
        {hero?.sub ||
          'Browse the catalog. Log in when you want to bag something.'}
      </p>
      <div className="d-flex flex-wrap gap-2 mt-4">
        <Link to={hero?.href || '/shop'}>
          <Button variant="light" className="px-4">
            {hero?.cta || 'Shop all'}
          </Button>
        </Link>
        {homeCategory ? (
          <Link to={shopPath(homeCategory)}>
            <Button variant="onDark" className="px-4">
              Shop {homeCategory.name.toLowerCase()}
            </Button>
          </Link>
        ) : null}
      </div>
    </section>
  );
}
