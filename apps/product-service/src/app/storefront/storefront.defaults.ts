/** Text defaults for a fresh storefront. Images are copied from seed/ on first create. */
export const DEFAULT_STOREFRONT = {
  key: 'default',
  appName: 'Swoop',
  tagline: 'New season',
  logoUrl: '',
  faviconUrl: '',
  currency: 'USD',
  hero: {
    headline: 'Gear up. Move fast.',
    sub: 'Curated apparel, shoes, and bags — simple checkout, no fuss.',
    imageUrl: '',
    href: '/shop',
    cta: 'Shop all',
  },
  banners: [
    {
      headline: 'Weekend picks',
      sub: 'Staff favorites — updated often.',
      imageSeed: 'promoWeekend' as const,
      href: '/shop',
      sortOrder: 0,
    },
    {
      headline: 'Fresh footwear',
      sub: 'Runners, boots, and everyday slip-ons.',
      imageSeed: 'promoShoes' as const,
      href: '/shop/shoes',
      sortOrder: 1,
    },
    {
      headline: 'Carry it all',
      sub: 'Backpacks and duffels for work and travel.',
      imageSeed: 'promoBags' as const,
      href: '/shop/bags',
      sortOrder: 2,
    },
  ],
};

export const SEED_UPLOADS = {
  logo: 'seed-logo.svg',
  favicon: 'seed-favicon.svg',
  hero: 'seed-hero.svg',
  promoWeekend: 'seed-promo-weekend.svg',
  promoShoes: 'seed-promo-shoes.svg',
  promoBags: 'seed-promo-bags.svg',
} as const;

export const SEED_SOURCES: Record<keyof typeof SEED_UPLOADS, string> = {
  logo: 'logo.svg',
  favicon: 'favicon.svg',
  hero: 'hero.svg',
  promoWeekend: 'promo-weekend.svg',
  promoShoes: 'promo-shoes.svg',
  promoBags: 'promo-bags.svg',
};
