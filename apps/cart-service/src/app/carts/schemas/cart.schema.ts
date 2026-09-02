import { mongooseSchemaOptions } from '@core-platform/common';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type CartDocument = HydratedDocument<Cart>;

@Schema({ _id: false })
export class CartItem {
  @Prop({ required: true })
  productId!: string;

  @Prop({ required: true, min: 1 })
  quantity!: number;
}

const CartItemSchema = SchemaFactory.createForClass(CartItem);

@Schema(mongooseSchemaOptions())
export class Cart {
  @Prop({ required: true, unique: true })
  userId!: string;

  @Prop({ type: [CartItemSchema], default: [] })
  items!: CartItem[];
}

export const CartSchema = SchemaFactory.createForClass(Cart);
