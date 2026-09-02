import { mongooseSchemaOptions } from '@core-platform/common';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ProductDocument = HydratedDocument<Product>;

@Schema(mongooseSchemaOptions())
export class Product {
  @Prop({ required: true })
  name!: string;

  @Prop({ required: true })
  description!: string;

  @Prop({ required: true, min: 0 })
  price!: number;

  @Prop({ required: true, unique: true })
  sku!: string;
}

export const ProductSchema = SchemaFactory.createForClass(Product);
