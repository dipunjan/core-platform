import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

export const STORE_CURRENCIES = [
  'USD',
  'EUR',
  'GBP',
  'INR',
  'CAD',
  'AUD',
] as const;

export const PAYMENT_PROVIDERS = [
  'auto',
  'stripe',
  'razorpay',
  'simulate',
] as const;

export class HeroBannerDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  headline?: string;

  @IsOptional()
  @IsString()
  sub?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsString()
  href?: string;

  @IsOptional()
  @IsString()
  cta?: string;
}

export class CreateBannerDto {
  @IsString()
  @MinLength(1)
  headline!: string;

  @IsOptional()
  @IsString()
  sub?: string;

  @IsString()
  @MinLength(1)
  imageUrl!: string;

  @IsString()
  @MinLength(1)
  href!: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

export class UpdateStorefrontDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  appName?: string;

  @IsOptional()
  @IsString()
  tagline?: string;

  @IsOptional()
  @IsString()
  logoUrl?: string;

  @IsOptional()
  @IsString()
  faviconUrl?: string;

  @IsOptional()
  @IsIn(STORE_CURRENCIES)
  currency?: (typeof STORE_CURRENCIES)[number];

  @IsOptional()
  @IsIn(PAYMENT_PROVIDERS)
  paymentProvider?: (typeof PAYMENT_PROVIDERS)[number];

  @IsOptional()
  @IsString()
  stripePublishableKey?: string;

  @IsOptional()
  @IsString()
  razorpayKeyId?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => HeroBannerDto)
  hero?: HeroBannerDto;
}
