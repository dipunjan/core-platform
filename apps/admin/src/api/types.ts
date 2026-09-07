export type User = {
  _id?: string;
  id?: string;
  email: string;
  name: string;
  phone?: string;
  role?: 'customer' | 'admin';
  address?: Address;
};

export type Address = {
  line1: string;
  line2?: string;
  city: string;
  region: string;
  postalCode: string;
  country: string;
};

export type Category = {
  _id?: string;
  id?: string;
  slug: string;
  name: string;
  blurb: string;
  sortOrder: number;
  showInNav: boolean;
  showOnHome: boolean;
};

export type Product = {
  _id?: string;
  id?: string;
  name: string;
  description: string;
  price: number;
  sku: string;
  category: string;
  featured?: boolean;
};

export type Inventory = {
  productId: string;
  quantity: number;
  reserved: number;
};

export type Banner = {
  _id?: string;
  id?: string;
  headline: string;
  sub: string;
  imageUrl: string;
  href: string;
  sortOrder: number;
};

export type HeroBanner = {
  headline: string;
  sub: string;
  imageUrl: string;
  href: string;
  cta: string;
};

export type Storefront = {
  logoUrl: string;
  currency?: string;
  hero?: HeroBanner;
  banners: Banner[];
};

export type OrderItem = {
  productId: string;
  quantity: number;
  unitPrice: number;
};

export type Order = {
  _id?: string;
  id?: string;
  userId?: string;
  items: OrderItem[];
  total: number;
  status: string;
  shippingAddress?: {
    line1: string;
    city: string;
    region: string;
    postalCode: string;
  };
  createdAt?: string;
};

export function docId(doc: { _id?: unknown; id?: unknown }): string {
  const value = doc.id ?? doc._id;
  return value == null ? '' : String(value);
}

export const STORE_CURRENCIES = [
  'USD',
  'EUR',
  'GBP',
  'INR',
  'CAD',
  'AUD',
] as const;

export function money(cents: number, currency = 'USD'): string {
  try {
    const fmt = new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
    });
    const digits = fmt.resolvedOptions().maximumFractionDigits ?? 2;
    return fmt.format(cents / 10 ** digits);
  } catch {
    return `$${(cents / 100).toFixed(2)}`;
  }
}
