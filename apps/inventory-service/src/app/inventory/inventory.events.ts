import {
  EVENTS_EXCHANGE,
  Events,
  OrderCancelledEvent,
  OrderCreatedEvent,
  ProductCreatedEvent,
} from '@core-platform/common';
import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { Injectable, Logger } from '@nestjs/common';
import { InventoryService } from './inventory.service';

@Injectable()
export class InventoryEventsConsumer {
  private readonly logger = new Logger(InventoryEventsConsumer.name);

  constructor(private readonly inventoryService: InventoryService) {}

  @RabbitSubscribe({
    exchange: EVENTS_EXCHANGE,
    routingKey: Events.PRODUCT_CREATED,
    queue: 'inventory.product.created',
  })
  async onProductCreated(payload: ProductCreatedEvent) {
    this.logger.log(`Creating stock row for product ${payload.id}`);
    await this.inventoryService.setQuantity(payload.id, { quantity: 0 });
  }

  @RabbitSubscribe({
    exchange: EVENTS_EXCHANGE,
    routingKey: Events.ORDER_CREATED,
    queue: 'inventory.order.created',
  })
  async onOrderCreated(payload: OrderCreatedEvent) {
    this.logger.log(`Reserving stock for order ${payload.id}`);
    for (const item of payload.items) {
      await this.inventoryService.reserve(item.productId, {
        amount: item.quantity,
      });
    }
  }

  @RabbitSubscribe({
    exchange: EVENTS_EXCHANGE,
    routingKey: Events.ORDER_CANCELLED,
    queue: 'inventory.order.cancelled',
  })
  async onOrderCancelled(payload: OrderCancelledEvent) {
    this.logger.log(`Releasing stock for order ${payload.id}`);
    for (const item of payload.items) {
      await this.inventoryService.release(item.productId, {
        amount: item.quantity,
      });
    }
  }
}
