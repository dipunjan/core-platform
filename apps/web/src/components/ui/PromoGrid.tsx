import { docId, type Banner } from '@/api';
import { PromoTile } from './PromoTile';

type PromoGridProps = {
  banners: Banner[];
};

export function PromoGrid({ banners }: PromoGridProps) {
  if (banners.length === 0) {
    return null;
  }
  return (
    <section className="mt-8 grid gap-4 sm:grid-cols-2">
      {banners.map((banner) => (
        <PromoTile key={docId(banner)} banner={banner} />
      ))}
    </section>
  );
}
