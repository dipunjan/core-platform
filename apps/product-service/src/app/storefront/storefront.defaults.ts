/** Sample hero + promo tiles for a fresh storefront (editable in admin). */
export const DEFAULT_STOREFRONT = {
  key: 'default',
  appName: 'swoop',
  tagline: 'New season',
  logoUrl: '/swoop-logo.png',
  faviconUrl: '/swoop-logo.png',
  currency: 'USD',
  hero: {
    headline: 'The drop is live. Grab it before it isn’t.',
    sub: 'Browse the catalog. Sign in when you’re ready to check out.',
    imageUrl:
      'https://images.unsplash.com/photo-1441984904996-e0b49598ccb7?w=1400&q=80&auto=format&fit=crop',
    href: '/shop',
    cta: 'Shop all',
  },
  banners: [
    {
      headline: 'Featured picks',
      sub: 'Staff favorites — updated often.',
      imageUrl:
        'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=900&q=80&auto=format&fit=crop',
      href: '/shop',
      sortOrder: 0,
    },
    {
      headline: 'Fresh arrivals',
      sub: 'See what landed this week.',
      imageUrl:
        'https://images.unsplash.com/photo-1556906781-9a412961c28c?w=900&q=80&auto=format&fit=crop',
      href: '/shop',
      sortOrder: 1,
    },
  ],
};
