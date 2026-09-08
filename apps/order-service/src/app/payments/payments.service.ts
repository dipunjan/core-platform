import {
  BadRequestException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { createHmac, timingSafeEqual } from 'crypto';
import { Model } from 'mongoose';
import Stripe from 'stripe';
import { OrdersService } from '../orders/orders.service';
import {
  StorefrontService,
  type StorefrontPaymentConfig,
} from '../orders/storefront.service';
import type { PaymentProvider } from '../orders/schemas/order.schema';
import {
  ProcessedWebhook,
  type ProcessedWebhookDocument,
} from './schemas/processed-webhook.schema';

export type CheckoutSession =
  | {
      provider: 'simulate';
      orderId: string;
      amount: number;
      currency: string;
    }
  | {
      provider: 'stripe';
      orderId: string;
      clientSecret: string;
      publishableKey: string;
      amount: number;
      currency: string;
    }
  | {
      provider: 'razorpay';
      orderId: string;
      razorpayOrderId: string;
      keyId: string;
      amount: number;
      currency: string;
    };

type ResolvedProvider = PaymentProvider;

@Injectable()
export class PaymentsService {
  private stripe: Stripe | null = null;

  constructor(
    private readonly config: ConfigService,
    private readonly orders: OrdersService,
    private readonly storefront: StorefrontService,
    @InjectModel(ProcessedWebhook.name)
    private readonly webhookModel: Model<ProcessedWebhookDocument>,
  ) {}

  async createCheckout(orderId: string, userId: string): Promise<CheckoutSession> {
    const order = await this.orders.findOne(orderId, userId);
    if (order.status !== 'pending' || order.paymentStatus === 'paid') {
      throw new BadRequestException('Order is not awaiting payment');
    }

    const storefront = await this.storefront.getPaymentConfig();
    const provider = this.resolveProvider(storefront);
    const currency = storefront.currency.toLowerCase();
    const amount = order.total;

    if (provider === 'simulate') {
      return { provider, orderId, amount, currency: storefront.currency };
    }

    if (provider === 'stripe') {
      const stripe = this.getStripe();
      const publishableKey =
        storefront.stripePublishableKey.trim() ||
        this.config.get<string>('STRIPE_PUBLISHABLE_KEY') ||
        '';
      if (!publishableKey) {
        throw new ServiceUnavailableException('Stripe publishable key is not configured');
      }

      const intent = await stripe.paymentIntents.create({
        amount,
        currency,
        metadata: { orderId, userId },
        automatic_payment_methods: { enabled: true },
      });
      if (!intent.client_secret) {
        throw new ServiceUnavailableException('Could not start Stripe payment');
      }

      order.paymentProvider = 'stripe';
      order.paymentStatus = 'processing';
      order.providerPaymentId = intent.id;
      await order.save();

      return {
        provider: 'stripe',
        orderId,
        clientSecret: intent.client_secret,
        publishableKey,
        amount,
        currency: storefront.currency,
      };
    }

    const keyId =
      storefront.razorpayKeyId.trim() ||
      this.config.get<string>('RAZORPAY_KEY_ID') ||
      '';
    const keySecret = this.config.get<string>('RAZORPAY_KEY_SECRET') ?? '';
    if (!keyId || !keySecret) {
      throw new ServiceUnavailableException('Razorpay keys are not configured');
    }

    const razorpayOrder = await this.createRazorpayOrder({
      amount,
      currency: storefront.currency,
      receipt: orderId,
      keyId,
      keySecret,
    });

    order.paymentProvider = 'razorpay';
    order.paymentStatus = 'processing';
    order.providerPaymentId = razorpayOrder.id;
    await order.save();

    return {
      provider: 'razorpay',
      orderId,
      razorpayOrderId: razorpayOrder.id,
      keyId,
      amount,
      currency: storefront.currency,
    };
  }

  async simulatePay(orderId: string, userId: string) {
    const storefront = await this.storefront.getPaymentConfig();
    const provider = this.resolveProvider(storefront);
    if (provider !== 'simulate' && !this.canSimulate()) {
      throw new BadRequestException('Simulated payments are disabled');
    }
    await this.orders.findOne(orderId, userId);
    return this.orders.markPaid(orderId, {
      provider: 'simulate',
      providerPaymentId: `sim_${Date.now()}`,
    });
  }

  async handleStripeWebhook(rawBody: Buffer, signature: string | undefined) {
    const secret = this.config.get<string>('STRIPE_WEBHOOK_SECRET');
    if (!secret) {
      throw new ServiceUnavailableException('Stripe webhook secret is not configured');
    }
    const stripe = this.getStripe();
    const event = stripe.webhooks.constructEvent(rawBody, signature ?? '', secret);

    if (await this.isProcessed('stripe', event.id)) {
      return { received: true };
    }

    if (event.type === 'payment_intent.succeeded') {
      const intent = event.data.object as Stripe.PaymentIntent;
      const orderId = intent.metadata?.orderId;
      if (orderId) {
        await this.orders.markPaid(orderId, {
          provider: 'stripe',
          providerPaymentId: intent.id,
        });
      }
    }

    await this.recordProcessed('stripe', event.id);
    return { received: true };
  }

  async handleRazorpayWebhook(rawBody: Buffer, signature: string | undefined) {
    const secret = this.config.get<string>('RAZORPAY_WEBHOOK_SECRET');
    if (!secret) {
      throw new ServiceUnavailableException('Razorpay webhook secret is not configured');
    }
    if (!this.verifyRazorpaySignature(rawBody, signature, secret)) {
      throw new BadRequestException('Invalid Razorpay webhook signature');
    }

    const payload = JSON.parse(rawBody.toString('utf8')) as {
      event?: string;
      payload?: {
        payment?: {
          entity?: {
            id?: string;
            order_id?: string;
            status?: string;
          };
        };
      };
    };

    const eventName = payload.event ?? '';
    const payment = payload.payload?.payment?.entity;
    const eventId = `${eventName}:${payment?.id ?? rawBody.toString('utf8').slice(0, 64)}`;

    if (await this.isProcessed('razorpay', eventId)) {
      return { received: true };
    }

    if (eventName === 'payment.captured' && payment?.order_id) {
      const order = await this.orders.findByProviderPaymentId(
        'razorpay',
        payment.order_id,
      );
      if (order) {
        await this.orders.markPaid(String(order._id), {
          provider: 'razorpay',
          providerPaymentId: payment.id ?? payment.order_id,
        });
      }
    }

    await this.recordProcessed('razorpay', eventId);
    return { received: true };
  }

  private resolveProvider(storefront: StorefrontPaymentConfig): ResolvedProvider {
    const setting = storefront.paymentProvider ?? 'auto';
    if (setting === 'simulate') {
      return 'simulate';
    }
    if (setting === 'stripe') {
      return this.hasStripeSecrets() ? 'stripe' : this.fallbackProvider();
    }
    if (setting === 'razorpay') {
      return this.hasRazorpaySecrets() ? 'razorpay' : this.fallbackProvider();
    }
    if (storefront.currency === 'INR') {
      if (this.hasRazorpaySecrets()) {
        return 'razorpay';
      }
      if (this.hasStripeSecrets()) {
        return 'stripe';
      }
      return this.fallbackProvider();
    }
    if (this.hasStripeSecrets()) {
      return 'stripe';
    }
    if (this.hasRazorpaySecrets()) {
      return 'razorpay';
    }
    return this.fallbackProvider();
  }

  private fallbackProvider(): ResolvedProvider {
    if (this.canSimulate()) {
      return 'simulate';
    }
    throw new ServiceUnavailableException('Payment provider is not configured');
  }

  private canSimulate(): boolean {
    return (
      this.config.get<string>('NODE_ENV') !== 'production' ||
      this.config.get<string>('PAYMENT_SIMULATE') === 'true'
    );
  }

  private hasStripeSecrets(): boolean {
    return Boolean(this.config.get<string>('STRIPE_SECRET_KEY')?.trim());
  }

  private hasRazorpaySecrets(): boolean {
    const id = this.config.get<string>('RAZORPAY_KEY_ID')?.trim();
    const secret = this.config.get<string>('RAZORPAY_KEY_SECRET')?.trim();
    return Boolean(id && secret);
  }

  private getStripe(): Stripe {
    if (!this.stripe) {
      const secret = this.config.get<string>('STRIPE_SECRET_KEY');
      if (!secret) {
        throw new ServiceUnavailableException('Stripe secret key is not configured');
      }
      this.stripe = new Stripe(secret);
    }
    return this.stripe;
  }

  private async createRazorpayOrder(input: {
    amount: number;
    currency: string;
    receipt: string;
    keyId: string;
    keySecret: string;
  }) {
    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${input.keyId}:${input.keySecret}`).toString('base64')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: input.amount,
        currency: input.currency,
        receipt: input.receipt,
      }),
    });
    if (!response.ok) {
      throw new ServiceUnavailableException('Could not create Razorpay order');
    }
    return (await response.json()) as { id: string };
  }

  private verifyRazorpaySignature(
    rawBody: Buffer,
    signature: string | undefined,
    secret: string,
  ): boolean {
    if (!signature) {
      return false;
    }
    const expected = createHmac('sha256', secret).update(rawBody).digest('hex');
    try {
      return timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
    } catch {
      return false;
    }
  }

  private async isProcessed(provider: string, eventId: string): Promise<boolean> {
    const row = await this.webhookModel.findOne({ eventId, provider }).exec();
    return Boolean(row);
  }

  private async recordProcessed(provider: string, eventId: string) {
    try {
      await this.webhookModel.create({ provider, eventId });
    } catch {
      // duplicate event — already processed
    }
  }
}
