import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import {
  apiMessage,
  http,
  type Category,
  type Inventory,
  type Product,
  type Storefront,
  urls,
} from '@/api';
import type { ShopFilters } from '@/lib/shopFilters';
import { productsListUrl } from '@/lib/shopFilters';
import { SEARCH_MIN_CHARS } from '@/lib/search';
import { catalogKeys } from './keys';

async function fetchStorefront(): Promise<Storefront | null> {
  try {
    const { data } = await http.get<Storefront>(urls.storefront);
    return data;
  } catch {
    return null;
  }
}

async function fetchProducts(): Promise<Product[]> {
  const { data } = await http.get<Product[]>(urls.products);
  return data;
}

async function fetchCategories(): Promise<Category[]> {
  const { data } = await http.get<Category[]>(urls.categories);
  return data;
}

async function fetchProduct(id: string): Promise<Product> {
  const { data } = await http.get<Product>(urls.product(id));
  return data;
}

async function fetchInventory(productId: string): Promise<Inventory | null> {
  try {
    const { data } = await http.get<Inventory>(urls.inventory(productId));
    return data;
  } catch {
    return null;
  }
}

export function useStorefrontQuery() {
  return useQuery({
    queryKey: catalogKeys.storefront(),
    queryFn: fetchStorefront,
    staleTime: 60_000,
  });
}

export function useProductsQuery(enabled = true) {
  return useQuery({
    queryKey: catalogKeys.products(),
    queryFn: fetchProducts,
    enabled,
  });
}

export function useCategoriesQuery(enabled = true) {
  return useQuery({
    queryKey: catalogKeys.categories(),
    queryFn: fetchCategories,
    enabled,
    staleTime: 60_000,
  });
}

export function useShopProductsQuery(filters: ShopFilters) {
  const qTooShort = Boolean(filters.q && filters.q.length < SEARCH_MIN_CHARS);
  return useQuery({
    queryKey: catalogKeys.shop(filters),
    queryFn: ({ signal }) =>
      http
        .get<Product[]>(productsListUrl(filters), { signal })
        .then((res) => res.data)
        .catch((err) => {
          if (axios.isCancel(err)) {
            throw err;
          }
          throw new Error(apiMessage(err));
        }),
    enabled: !qTooShort,
  });
}

export function useProductQuery(id: string | undefined) {
  return useQuery({
    queryKey: catalogKeys.product(id ?? ''),
    queryFn: () => fetchProduct(id!),
    enabled: Boolean(id),
  });
}

export function useInventoryQuery(productId: string | undefined) {
  return useQuery({
    queryKey: catalogKeys.inventory(productId ?? ''),
    queryFn: () => fetchInventory(productId!),
    enabled: Boolean(productId),
  });
}
