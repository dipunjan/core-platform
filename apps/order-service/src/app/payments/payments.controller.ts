import {
  Controller,
  Headers,
  Param,
  Post,
  Req,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Public, CurrentUser, type AuthUser } from '@core-platform/common';
import type { Request } from 'express';
import { PaymentsService } from './payments.service';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @Post('orders/:orderId/checkout')
  checkout(@CurrentUser() user: AuthUser, @Param('orderId') orderId: string) {
    return this.payments.createCheckout(orderId, user.sub);
  }

  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('orders/:orderId/simulate')
  simulate(@CurrentUser() user: AuthUser, @Param('orderId') orderId: string) {
    return this.payments.simulatePay(orderId, user.sub);
  }

  @Public()
  @Post('webhooks/stripe')
  stripeWebhook(
    @Req() req: Request & { rawBody?: Buffer },
    @Headers('stripe-signature') signature?: string,
  ) {
    const rawBody = req.rawBody ?? Buffer.from('');
    return this.payments.handleStripeWebhook(rawBody, signature);
  }

  @Public()
  @Post('webhooks/razorpay')
  razorpayWebhook(
    @Req() req: Request & { rawBody?: Buffer },
    @Headers('x-razorpay-signature') signature?: string,
  ) {
    const rawBody = req.rawBody ?? Buffer.from('');
    return this.payments.handleRazorpayWebhook(rawBody, signature);
  }
}
