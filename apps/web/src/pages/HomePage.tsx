import { useEffect } from 'react';
import { docId } from '@/api';
import { CategoryGrid, ProductCard } from '@/components';
import {
  EmptyState,
  Flash,
  HeroBanner,
  ProductGrid,
  PromoGrid,
  Section,
} from '@/components/ui';
import { useCatalog, siteName } from '@/hooks';

export function HomePage() {
  const { products, categories, storefront, error, loadCatalog } = useCatalog();

  useEffect(() => {
    loadCatalog();
  }, [loadCatalog]);

  const featured = products.filter((product) => product.featured);
  const homeCategory = categories.find((category) => category.showOnHome);
  const hero = storefront?.hero;
  const eyebrow = storefront?.tagline?.trim() || siteName(storefront);
  const extras = [...(storefront?.banners ?? [])].sort(
    (a, b) => a.sortOrder - b.sortOrder,
  );

  return (
    <>
      <HeroBanner
        hero={hero}
        eyebrow={eyebrow}
        homeCategory={homeCategory}
      />
      <PromoGrid banners={extras} />
      <Section
        title="Shop by category"
        description="Pick a lane. Everything else can wait."
      >
        <CategoryGrid categories={categories} />
      </Section>
      <Section
        title="Featured"
        description="Picked in the catalog. An admin can change this later."
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
