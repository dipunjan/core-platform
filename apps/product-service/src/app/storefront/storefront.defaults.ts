/** Text defaults for a fresh storefront. Images are seeded as uploaded files. */
export const DEFAULT_STOREFRONT = {
  key: 'default',
  appName: 'My Shop',
  tagline: 'Welcome',
  logoUrl: '',
  faviconUrl: '',
  currency: 'USD',
  hero: {
    headline: 'The drop is live. Grab it before it isn’t.',
    sub: 'Browse the catalog. Sign in when you’re ready to check out.',
    imageUrl: '',
    href: '/shop',
    cta: 'Shop all',
  },
  banners: [] as Array<{
    headline: string;
    sub: string;
    imageUrl: string;
    href: string;
    sortOrder: number;
  }>,
};

export const SEED_UPLOADS = {
  logo: 'seed-logo.svg',
  favicon: 'seed-favicon.svg',
  hero: 'seed-hero.svg',
  promo: 'seed-promo.svg',
} as const;

export const SEED_SOURCES: Record<keyof typeof SEED_UPLOADS, string> = {
  logo: 'logo.svg',
  favicon: 'favicon.svg',
  hero: 'hero.svg',
  promo: 'promo.svg',
};
