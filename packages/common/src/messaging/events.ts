export const EVENTS_EXCHANGE = 'core-platform';

export const Events = {
  USER_CREATED: 'user.created',
  USER_UPDATED: 'user.updated',
  PRODUCT_CREATED: 'product.created',
  ORDER_CREATED: 'order.created',
  ORDER_CANCELLED: 'order.cancelled',
} as const;

export type EventName = (typeof Events)[keyof typeof Events];

export interface UserCreatedEvent {
  id: string;
  email: string;
  name: string;
}

export interface UserUpdatedEvent {
  id: string;
  email: string;
  name: string;
}

export interface ProductCreatedEvent {
  id: string;
  name: string;
  sku: string;
}

export interface OrderItemEvent {
  productId: string;
  quantity: number;
}

export interface OrderCreatedEvent {
  id: string;
  userId: string;
  items: OrderItemEvent[];
}

export interface OrderCancelledEvent {
  id: string;
  userId: string;
  items: OrderItemEvent[];
}
