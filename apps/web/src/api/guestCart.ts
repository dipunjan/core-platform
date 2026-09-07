import type { Cart, CartItem } from './types';

export const GUEST_CART_KEY = 'swoop.guest-cart';

export function emptyGuestCart(): Cart {
  return { userId: 'guest', items: [] };
}

export function readGuestCart(): Cart {
  try {
    const raw = localStorage.getItem(GUEST_CART_KEY);
    if (!raw) {
      return emptyGuestCart();
    }
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return emptyGuestCart();
    }
    const items: CartItem[] = [];
    for (const row of parsed) {
      if (
        row &&
        typeof row === 'object' &&
        'productId' in row &&
        'quantity' in row &&
        typeof row.productId === 'string' &&
        typeof row.quantity === 'number' &&
        row.quantity > 0
      ) {
        items.push({ productId: row.productId, quantity: row.quantity });
      }
    }
    return { userId: 'guest', items };
  } catch {
    return emptyGuestCart();
  }
}

export function writeGuestCart(items: CartItem[]): Cart {
  localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items));
  return { userId: 'guest', items };
}

export function clearGuestCart() {
  localStorage.removeItem(GUEST_CART_KEY);
}

export function addGuestItem(productId: string, quantity: number): Cart {
  const cart = readGuestCart();
  const existing = cart.items.find((item) => item.productId === productId);
  if (existing) {
    existing.quantity += quantity;
  } else {
    cart.items.push({ productId, quantity });
  }
  return writeGuestCart(cart.items);
}

export function setGuestQty(productId: string, quantity: number): Cart {
  const cart = readGuestCart();
  if (quantity < 1) {
    return writeGuestCart(
      cart.items.filter((item) => item.productId !== productId),
    );
  }
  const existing = cart.items.find((item) => item.productId === productId);
  if (!existing) {
    return writeGuestCart([...cart.items, { productId, quantity }]);
  }
  existing.quantity = quantity;
  return writeGuestCart(cart.items);
}

export function safeNext(value: string | null | undefined): string {
  if (!value || !value.startsWith('/') || value.startsWith('//')) {
    return '/';
  }
  return value;
}
