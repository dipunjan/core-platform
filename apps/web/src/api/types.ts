export type User = {
  _id?: string;
  id?: string;
  email: string;
  name: string;
};

export type Product = {
  _id?: string;
  id?: string;
  name: string;
  description: string;
  price: number;
  sku: string;
};

export type Inventory = {
  productId: string;
  quantity: number;
  reserved: number;
};

export type CartItem = { productId: string; quantity: number };

export type Cart = { userId: string; items: CartItem[] };

export type OrderItem = {
  productId: string;
  quantity: number;
  unitPrice: number;
};

export type Order = {
  _id?: string;
  id?: string;
  items: OrderItem[];
  total: number;
  status: string;
};

export function docId(doc: { _id?: unknown; id?: unknown }): string {
  const value = doc.id ?? doc._id;
  return value == null ? '' : String(value);
}

export function money(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}
