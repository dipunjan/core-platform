import { Link } from 'react-router-dom';
import type { Banner } from '@/api';

type PromoTileProps = {
  banner: Banner;
};

export function PromoTile({ banner }: PromoTileProps) {
  return (
    <Link
      to={banner.href || '/shop'}
      className="flex min-h-[11rem] flex-col justify-end overflow-hidden rounded-xl bg-zinc-900 p-6 text-white transition hover:brightness-110"
      style={
        banner.imageUrl
          ? {
              backgroundImage: `linear-gradient(rgba(9,9,11,.65), rgba(9,9,11,.65)), url(${banner.imageUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }
          : undefined
      }
    >
      <strong className="text-lg">{banner.headline}</strong>
      {banner.sub ? (
        <p className="mt-1 text-sm text-zinc-300">{banner.sub}</p>
      ) : null}
    </Link>
  );
}
