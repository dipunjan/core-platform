import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export type StorefrontPaymentConfig = {
  currency: string;
  paymentProvider: 'auto' | 'stripe' | 'razorpay' | 'simulate';
  stripePublishableKey: string;
  razorpayKeyId: string;
};

@Injectable()
export class StorefrontService {
  constructor(private readonly config: ConfigService) {}

  async getPaymentConfig(): Promise<StorefrontPaymentConfig> {
    const base =
      this.config.get<string>('PRODUCT_SERVICE_URL') ?? 'http://localhost:3001';
    const url = `${base.replace(/\/$/, '')}/api/storefront`;
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new ServiceUnavailableException('Could not load storefront settings');
      }
      const body = (await response.json()) as Partial<StorefrontPaymentConfig>;
      return {
        currency: (body.currency ?? 'USD').toUpperCase(),
        paymentProvider: body.paymentProvider ?? 'auto',
        stripePublishableKey: body.stripePublishableKey ?? '',
        razorpayKeyId: body.razorpayKeyId ?? '',
      };
    } catch (err) {
      if (err instanceof ServiceUnavailableException) {
        throw err;
      }
      throw new ServiceUnavailableException('Storefront service is unreachable');
    }
  }
}
