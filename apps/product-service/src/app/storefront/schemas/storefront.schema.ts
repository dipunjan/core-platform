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
  @Prop({ default: 'The drop is live. Grab it before it isn’t.', trim: true })
  headline!: string;

  @Prop({
    default: 'Browse the catalog. Log in when you want to bag something.',
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

  @Prop({ default: 'My Shop', trim: true })
  appName!: string;

  @Prop({ default: 'Welcome', trim: true })
  tagline!: string;

  @Prop({ default: '/swoop-logo.png', trim: true })
  logoUrl!: string;

  @Prop({ default: '/swoop-logo.png', trim: true })
  faviconUrl!: string;

  @Prop({ default: 'USD', uppercase: true, trim: true })
  currency!: string;

  @Prop({ type: HeroBannerSchema, default: () => ({}) })
  hero!: HeroBanner;

  @Prop({ type: [BannerSchema], default: [] })
  banners!: Banner[];
}

export const StorefrontSchema = SchemaFactory.createForClass(Storefront);
