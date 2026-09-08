import { Link } from 'react-router-dom';
import type { Banner } from '@/api';
import { brandImage } from '@/lib/brandImage';

type PromoTileProps = {
  banner: Banner;
};

export function PromoTile({ banner }: PromoTileProps) {
  return (
    <Link
      to={banner.href || '/shop'}
      className="d-flex flex-column justify-content-end overflow-hidden rounded-3 text-white text-decoration-none p-4 promo-tile"
      style={{
        backgroundImage: `linear-gradient(rgba(9,9,11,.65), rgba(9,9,11,.65)), url(${brandImage(banner.imageUrl, 'promo')})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <strong className="fs-5">{banner.headline}</strong>
      {banner.sub ? (
        <p className="small text-white-50 mt-1 mb-0">{banner.sub}</p>
      ) : null}
    </Link>
  );
}
