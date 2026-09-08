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
    <section className="row row-cols-1 row-cols-sm-2 g-3 mt-4">
      {banners.map((banner) => (
        <div key={docId(banner)} className="col">
          <PromoTile banner={banner} />
        </div>
      ))}
    </section>
  );
}
