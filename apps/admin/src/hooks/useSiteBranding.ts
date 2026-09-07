import { useEffect } from 'react';
import type { Storefront } from '@/api';

const FALLBACK_ICON = '/swoop-logo.png';

export function useSiteBranding(
  storefront: Storefront | null | undefined,
  pageTitle = 'Admin',
) {
  useEffect(() => {
    const appName = storefront?.appName?.trim() || 'Shop';
    document.title = `${pageTitle} · ${appName}`;

    const icon =
      storefront?.faviconUrl?.trim() ||
      storefront?.logoUrl?.trim() ||
      FALLBACK_ICON;
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
