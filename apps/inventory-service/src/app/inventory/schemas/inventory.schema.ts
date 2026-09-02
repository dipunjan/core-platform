import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type InventoryDocument = HydratedDocument<Inventory>;

@Schema({ timestamps: true })
export class Inventory {
  @Prop({ required: true, unique: true })
  productId!: string;

  @Prop({ required: true, min: 0, default: 0 })
  quantity!: number;

  @Prop({ required: true, min: 0, default: 0 })
  reserved!: number;

  @Prop({ type: [String], default: [] })
  reservationKeys!: string[];
}

export const InventorySchema = SchemaFactory.createForClass(Inventory);
