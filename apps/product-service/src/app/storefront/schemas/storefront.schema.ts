import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type StorefrontDocument = HydratedDocument<Storefront>;

@Schema()
export class Banner {
  @Prop({ required: true, trim: true })
  headline!: string;

  @Prop({ default: '', trim: true })
  sub!: string;

  @Prop({ required: true, trim: true })
  imageUrl!: string;

  @Prop({ default: '/shop', trim: true })
  href!: string;

  @Prop({ default: 0 })
  sortOrder!: number;
}

export const BannerSchema = SchemaFactory.createForClass(Banner);

@Schema({ _id: false })
export class HeroBanner {
  @Prop({ default: 'Gear up. Move fast.', trim: true })
  headline!: string;

  @Prop({
    default: 'Curated apparel, shoes, and bags — simple checkout, no fuss.',
    trim: true,
  })
  sub!: string;

  @Prop({ default: '', trim: true })
  imageUrl!: string;

  @Prop({ default: '/shop', trim: true })
  href!: string;

  @Prop({ default: 'Shop all', trim: true })
  cta!: string;
}

export const HeroBannerSchema = SchemaFactory.createForClass(HeroBanner);

@Schema({ timestamps: true })
export class Storefront {
  @Prop({ required: true, unique: true, default: 'default' })
  key!: string;

  @Prop({ default: 'Swoop', trim: true })
  appName!: string;

  @Prop({ default: 'New season', trim: true })
  tagline!: string;

  @Prop({ default: '', trim: true })
  logoUrl!: string;

  @Prop({ default: '', trim: true })
  faviconUrl!: string;

  @Prop({ default: 'USD', uppercase: true, trim: true })
  currency!: string;

  @Prop({ type: HeroBannerSchema, default: () => ({}) })
  hero!: HeroBanner;

  @Prop({ type: [BannerSchema], default: [] })
  banners!: Banner[];
}

export const StorefrontSchema = SchemaFactory.createForClass(Storefront);
