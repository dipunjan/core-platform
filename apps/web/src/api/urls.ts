export const USER_API = 'http://localhost:3000/api';
export const PRODUCT_API = 'http://localhost:3001/api';
export const INVENTORY_API = 'http://localhost:3002/api';
export const CART_API = 'http://localhost:3003/api';
export const ORDER_API = 'http://localhost:3004/api';

export const urls = {
  me: `${USER_API}/users/me`,
  login: `${USER_API}/auth/login`,
  register: `${USER_API}/users`,
  logout: `${USER_API}/auth/logout`,
  refresh: `${USER_API}/auth/refresh`,
  products: `${PRODUCT_API}/products`,
  product: (id: string) => `${PRODUCT_API}/products/${id}`,
  categories: `${PRODUCT_API}/categories`,
  storefront: `${PRODUCT_API}/storefront`,
  inventory: (productId: string) => `${INVENTORY_API}/inventory/${productId}`,
  cart: `${CART_API}/carts`,
  cartItems: `${CART_API}/carts/items`,
  cartItem: (productId: string) => `${CART_API}/carts/items/${productId}`,
  orders: `${ORDER_API}/orders`,
  order: (id: string) => `${ORDER_API}/orders/${id}`,
  orderStatus: (id: string) => `${ORDER_API}/orders/${id}/status`,
  paymentCheckout: (orderId: string) =>
    `${ORDER_API}/payments/orders/${orderId}/checkout`,
  paymentSimulate: (orderId: string) =>
    `${ORDER_API}/payments/orders/${orderId}/simulate`,
};
