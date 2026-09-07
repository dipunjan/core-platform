export type BrandImageKind = 'logo' | 'favicon' | 'hero' | 'promo';

const PLACEHOLDERS: Record<BrandImageKind, string> = {
  logo: '/placeholders/logo.svg',
  favicon: '/placeholders/favicon.svg',
  hero: '/placeholders/hero.svg',
  promo: '/placeholders/promo.svg',
};

export function hasBrandImage(url?: string | null) {
  return Boolean(url?.trim());
}

export function brandImage(
  url?: string | null,
  kind: BrandImageKind = 'logo',
) {
  const trimmed = url?.trim();
  return trimmed || PLACEHOLDERS[kind];
}
