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
      className="hero-banner overflow-hidden text-white px-4 px-sm-5 py-5 py-lg-6 d-flex flex-column justify-content-end"
      style={{
        backgroundImage: `url(${brandImage(hero?.imageUrl, 'hero')})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <p className="small fw-bold text-uppercase text-accent mb-0">{eyebrow}</p>
      <h1 className="display-5 fw-bold mt-3 mb-0 hero-headline">
        {hero?.headline || 'The drop is live. Grab it before it isn’t.'}
      </h1>
      <p className="text-white-50 mt-3 hero-subhead mb-0">
        {hero?.sub ||
          'Browse the catalog. Log in when you want to bag something.'}
      </p>
      <div className="d-flex flex-wrap gap-2 mt-4 pb-1">
        <Link to={hero?.href || '/shop'}>
          <Button variant="light">
            {hero?.cta || 'Shop all'}
          </Button>
        </Link>
        {homeCategory ? (
          <Link to={shopPath(homeCategory)}>
            <Button variant="onDark">
              Shop {homeCategory.name.toLowerCase()}
            </Button>
          </Link>
        ) : null}
      </div>
    </section>
  );
}
