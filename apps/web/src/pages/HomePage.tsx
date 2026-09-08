import { docId } from '@/api';
import { CategoryRail, ProductCard } from '@/components';
import {
  EmptyState,
  Flash,
  HeroBanner,
  PageLoader,
  ProductGrid,
  PromoGrid,
  Section,
} from '@/components/ui';
import { useCatalog } from '@/hooks';

export function HomePage() {
  const { products, categories, storefront, error, loading } = useCatalog({
    load: true,
  });

  const featured = products.filter((product) => product.featured);
  const homeCategory = categories.find((category) => category.showOnHome);
  const hero = storefront?.hero;
  const eyebrow = storefront?.tagline?.trim() || storefront?.appName?.trim() || '';
  const extras = [...(storefront?.banners ?? [])].sort(
    (a, b) => a.sortOrder - b.sortOrder,
  );

  if (loading && products.length === 0) {
    return <PageLoader label="Loading shop…" />;
  }

  return (
    <>
      {hero ? (
        <HeroBanner
          hero={hero}
          eyebrow={eyebrow}
          homeCategory={homeCategory}
        />
      ) : null}
      <PromoGrid banners={extras} />
      <Section title="Shop by category">
        <CategoryRail categories={categories} />
      </Section>
      <Section
        title="Featured"
        action={{ to: '/shop', label: 'View all' }}
      >
        <Flash>{error}</Flash>
        {!error && featured.length === 0 ? (
          <EmptyState>Nothing featured yet.</EmptyState>
        ) : (
          <ProductGrid cols={4}>
            {featured.map((product) => (
              <ProductCard
                key={docId(product)}
                product={product}
                categories={categories}
              />
            ))}
          </ProductGrid>
        )}
      </Section>
    </>
  );
}
