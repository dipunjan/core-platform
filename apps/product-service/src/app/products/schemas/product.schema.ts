import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ProductDocument = HydratedDocument<Product>;

@Schema({ timestamps: true })
export class Product {
  @Prop({ required: true })
  name!: string;

  @Prop({ required: true })
  description!: string;

  @Prop({ required: true, min: 0 })
  price!: number;

  @Prop({ required: true, unique: true })
  sku!: string;

  @Prop({ required: true, index: true })
  category!: string;

  @Prop({ required: true, default: false, index: true })
  featured!: boolean;
}

export const ProductSchema = SchemaFactory.createForClass(Product);
