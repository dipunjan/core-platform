import { mongooseSchemaOptions } from '@core-platform/common';
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

@Schema(mongooseSchemaOptions())
export class Order {
  @Prop({ required: true })
  userId!: string;

  @Prop({ type: [OrderItemSchema], required: true })
  items!: OrderItem[];

  @Prop({ required: true, min: 0 })
  total!: number;

  @Prop({ required: true, enum: ORDER_STATUSES, default: 'pending' })
  status!: OrderStatus;
}

export const OrderSchema = SchemaFactory.createForClass(Order);
