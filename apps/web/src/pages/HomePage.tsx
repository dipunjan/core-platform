import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { docId, shopPath } from '@/api';
import { CategoryGrid, ProductCard } from '@/components';
import { Button, EmptyState, Flash } from '@/components/ui';
import { useCatalog } from '@/hooks';

export function HomePage() {
  const { products, categories, storefront, error, loadCatalog } = useCatalog();

  useEffect(() => {
    loadCatalog();
  }, [loadCatalog]);

  const featured = products.filter((product) => product.featured);
  const homeCategory = categories.find((category) => category.showOnHome);
  const hero = storefront?.hero;
  const extras = [...(storefront?.banners ?? [])].sort(
    (a, b) => a.sortOrder - b.sortOrder,
  );

  return (
    <>
      <section
        className="overflow-hidden rounded-2xl bg-zinc-950 px-6 py-14 text-white sm:px-10 sm:py-20"
        style={
          hero?.imageUrl
            ? {
                backgroundImage: `linear-gradient(rgba(9,9,11,.72), rgba(9,9,11,.72)), url(${hero.imageUrl})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }
            : undefined
        }
      >
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-400">
          swoop
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

      {extras.length > 0 ? (
        <section className="mt-8 grid gap-4 sm:grid-cols-2">
          {extras.map((banner) => (
            <Link
              key={docId(banner)}
              to={banner.href || '/shop'}
              className="overflow-hidden rounded-xl bg-zinc-900 p-6 text-white"
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
          ))}
        </section>
      ) : null}

      <section className="mt-14">
        <h2 className="text-xl font-semibold tracking-tight text-zinc-950">
          Shop by category
        </h2>
        <p className="mt-1 mb-6 text-sm text-zinc-500">
          Pick a lane. Everything else can wait.
        </p>
        <CategoryGrid categories={categories} />
      </section>

      <section className="mt-14">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-zinc-950">
              Featured
            </h2>
            <p className="mt-1 text-sm text-zinc-500">
              Picked in the catalog. An admin can change this later.
            </p>
          </div>
          <Link
            to="/shop?featured=1"
            className="text-sm font-semibold text-emerald-800 hover:underline"
          >
            View featured
          </Link>
        </div>
        <Flash>{error}</Flash>
        {!error && featured.length === 0 ? (
          <EmptyState>Nothing featured yet.</EmptyState>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((product) => (
              <ProductCard
                key={docId(product)}
                product={product}
                categories={categories}
              />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
