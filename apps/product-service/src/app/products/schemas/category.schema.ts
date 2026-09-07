import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type CategoryDocument = HydratedDocument<Category>;

@Schema({ timestamps: true })
export class Category {
  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  slug!: string;

  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ default: '' })
  blurb!: string;

  @Prop({ default: 0 })
  sortOrder!: number;

  @Prop({ default: true })
  showInNav!: boolean;

  @Prop({ default: false })
  showOnHome!: boolean;
}

export const CategorySchema = SchemaFactory.createForClass(Category);
