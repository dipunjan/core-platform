import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type OrderDocument = HydratedDocument<Order>;

export const ORDER_STATUSES = [
  'pending',
  'paid',
  'shipped',
  'cancelled',
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const PAYMENT_STATUSES = [
  'unpaid',
  'processing',
  'paid',
  'failed',
  'refunded',
] as const;

export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const PAYMENT_PROVIDERS = ['stripe', 'razorpay', 'simulate'] as const;

export type PaymentProvider = (typeof PAYMENT_PROVIDERS)[number];

@Schema({ _id: false })
export class OrderItem {
  @Prop({ required: true })
  productId!: string;

  @Prop({ required: true, min: 1 })
  quantity!: number;

  @Prop({ required: true, min: 0 })
  unitPrice!: number;
}

const OrderItemSchema = SchemaFactory.createForClass(OrderItem);

@Schema({ _id: false })
export class ShippingAddress {
  @Prop({ required: true })
  line1!: string;

  @Prop({ default: '' })
  line2!: string;

  @Prop({ required: true })
  city!: string;

  @Prop({ required: true })
  region!: string;

  @Prop({ required: true })
  postalCode!: string;

  @Prop({ required: true })
  country!: string;
}

const ShippingAddressSchema = SchemaFactory.createForClass(ShippingAddress);

@Schema({ timestamps: true })
export class Order {
  @Prop({ required: true })
  userId!: string;

  @Prop({ type: [OrderItemSchema], required: true })
  items!: OrderItem[];

  @Prop({ type: ShippingAddressSchema, required: true })
  shippingAddress!: ShippingAddress;

  @Prop({ required: true, min: 0 })
  total!: number;

  @Prop({
    type: String,
    required: true,
    enum: ORDER_STATUSES,
    default: 'pending',
  })
  status!: OrderStatus;

  @Prop({
    type: String,
    enum: PAYMENT_STATUSES,
    default: 'unpaid',
  })
  paymentStatus!: PaymentStatus;

  @Prop({ type: String, enum: PAYMENT_PROVIDERS })
  paymentProvider?: PaymentProvider;

  @Prop()
  providerPaymentId?: string;

  @Prop()
  paidAt?: Date;

  @Prop({ sparse: true })
  idempotencyKey?: string;
}

export const OrderSchema = SchemaFactory.createForClass(Order);
OrderSchema.index({ userId: 1, createdAt: -1 });
OrderSchema.index(
  { userId: 1, idempotencyKey: 1 },
  { unique: true, sparse: true },
);
