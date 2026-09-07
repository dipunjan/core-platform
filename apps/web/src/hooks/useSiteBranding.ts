import { useEffect } from 'react';
import type { Storefront } from '@/api';
import { brandImage } from '@/lib/brandImage';

export function useSiteBranding(
  storefront: Storefront | null | undefined,
  pageTitle?: string,
) {
  useEffect(() => {
    const appName = storefront?.appName?.trim() || 'Shop';
    document.title = pageTitle ? `${pageTitle} · ${appName}` : appName;

    const icon = brandImage(storefront?.faviconUrl || storefront?.logoUrl, 'favicon');
    let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    if (link.href !== icon) {
      link.href = icon;
    }
  }, [
    storefront?.appName,
    storefront?.faviconUrl,
    storefront?.logoUrl,
    pageTitle,
  ]);
}

export function siteName(storefront: Storefront | null | undefined) {
  return storefront?.appName?.trim() || 'Shop';
}
