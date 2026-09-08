import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  addGuestItem,
  clearGuestCart,
  docId,
  http,
  readGuestCart,
  setGuestQty,
  urls,
  type Address,
  type Cart,
  type Order,
  type Product,
  type User,
} from '@/api';
import { authKeys } from './keys';
import { catalogKeys } from './keys';
import { cartKeys } from './keys';
import { useMeQuery } from './auth';

async function fetchServerCart(): Promise<Cart> {
  const { data } = await http.get<Cart>(urls.cart);
  return data;
}

function readSessionUser(queryClient: ReturnType<typeof useQueryClient>): User | null {
  return queryClient.getQueryData<User | null>(authKeys.me) ?? null;
}

export function useCartQuery() {
  const { data: user } = useMeQuery();
  const userId = user ? docId(user) : null;

  return useQuery({
    queryKey: cartKeys.detail(userId),
    queryFn: async () => {
      if (!userId) {
        return readGuestCart();
      }
      return fetchServerCart();
    },
  });
}

export function useMergeGuestCartMutation() {
  const queryClient = useQueryClient();
  const user = readSessionUser(queryClient);
  const userId = user ? docId(user) : null;

  return useMutation({
    mutationFn: async () => {
      const guest = readGuestCart();
      for (const item of guest.items) {
        await http.post<Cart>(urls.cartItems, item);
      }
      clearGuestCart();
      return fetchServerCart();
    },
    onSuccess: (cart) => {
      queryClient.setQueryData(cartKeys.detail(userId), cart);
    },
  });
}

export function useAddToCartMutation() {
  const queryClient = useQueryClient();
  const user = readSessionUser(queryClient);
  const userId = user ? docId(user) : null;

  return useMutation({
    mutationFn: async (input: { productId: string; quantity: number }) => {
      if (!userId) {
        return addGuestItem(input.productId, input.quantity);
      }
      const { data } = await http.post<Cart>(urls.cartItems, input);
      return data;
    },
    onSuccess: (cart) => {
      queryClient.setQueryData(cartKeys.detail(userId), cart);
    },
  });
}

export function useSetCartQtyMutation() {
  const queryClient = useQueryClient();
  const user = readSessionUser(queryClient);
  const userId = user ? docId(user) : null;

  return useMutation({
    mutationFn: async (input: { productId: string; quantity: number }) => {
      if (!userId) {
        return setGuestQty(input.productId, input.quantity);
      }
      if (input.quantity < 1) {
        const { data } = await http.delete<Cart>(urls.cartItem(input.productId));
        return data;
      }
      const { data } = await http.patch<Cart>(urls.cartItem(input.productId), {
        quantity: input.quantity,
      });
      return data;
    },
    onSuccess: (cart) => {
      queryClient.setQueryData(cartKeys.detail(userId), cart);
    },
  });
}

export function useCheckoutMutation() {
  const queryClient = useQueryClient();
  const user = readSessionUser(queryClient);
  const userId = user ? docId(user) : null;

  return useMutation({
    mutationFn: async (shippingAddress: Address) => {
      if (!userId) {
        throw new Error('Sign in to checkout');
      }
      const cart =
        queryClient.getQueryData<Cart>(cartKeys.detail(userId)) ??
        await fetchServerCart();
      const items = cart.items ?? [];
      if (items.length === 0) {
        throw new Error('Cart is empty');
      }
      const products =
        queryClient.getQueryData<Product[]>(catalogKeys.products()) ?? [];
      const byId = new Map(products.map((product) => [docId(product), product]));
      for (const item of items) {
        if (!byId.get(item.productId)) {
          throw new Error('A product in your cart is missing. Refresh.');
        }
      }
      const orderItems = items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      }));
      const idempotencyKey =
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID()
          : `${Date.now()}`;
      const { data: order } = await http.post<Order>(
        urls.orders,
        { items: orderItems, shippingAddress },
        { headers: { 'Idempotency-Key': idempotencyKey } },
      );
      return order;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: cartKeys.all });
      void queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}
