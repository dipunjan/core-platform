export const USER_API = 'http://localhost:3000/api';
export const PRODUCT_API = 'http://localhost:3001/api';
export const INVENTORY_API = 'http://localhost:3002/api';
export const ORDER_API = 'http://localhost:3004/api';

export const urls = {
  me: `${USER_API}/users/me`,
  login: `${USER_API}/auth/login`,
  logout: `${USER_API}/auth/logout`,
  refresh: `${USER_API}/auth/refresh`,
  products: `${PRODUCT_API}/products`,
  product: (id: string) => `${PRODUCT_API}/products/${id}`,
  categories: `${PRODUCT_API}/categories`,
  category: (id: string) => `${PRODUCT_API}/categories/${id}`,
  storefront: `${PRODUCT_API}/storefront`,
  storefrontAssets: `${PRODUCT_API}/storefront/assets`,
  banners: `${PRODUCT_API}/storefront/banners`,
  banner: (id: string) => `${PRODUCT_API}/storefront/banners/${id}`,
  users: `${USER_API}/users`,
  managedUsers: `${USER_API}/users/managed`,
  user: (id: string) => `${USER_API}/users/${id}`,
  userRole: (id: string) => `${USER_API}/users/${id}/role`,
  inventory: `${INVENTORY_API}/inventory`,
  inventoryItem: (productId: string) => `${INVENTORY_API}/inventory/${productId}`,
  ordersAdmin: `${ORDER_API}/orders/admin`,
};
