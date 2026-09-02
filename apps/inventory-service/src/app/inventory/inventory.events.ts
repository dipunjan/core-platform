import {
  eventSubscribe,
  Events,
  type OrderCancelledEvent,
  type OrderCreatedEvent,
  type ProductCreatedEvent,
} from '@core-platform/common';
import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { Injectable, Logger } from '@nestjs/common';
import { InventoryService } from './inventory.service';

@Injectable()
export class InventoryEventsConsumer {
  private readonly logger = new Logger(InventoryEventsConsumer.name);

  constructor(private readonly inventoryService: InventoryService) {}

  @RabbitSubscribe(
    eventSubscribe('inventory.product.created', Events.PRODUCT_CREATED),
  )
  async onProductCreated(payload: ProductCreatedEvent) {
    this.logger.log(`Creating stock row for product ${payload.id}`);
    await this.inventoryService.setQuantity(payload.id, { quantity: 0 });
  }

  @RabbitSubscribe(
    eventSubscribe('inventory.order.created', Events.ORDER_CREATED),
  )
  async onOrderCreated(payload: OrderCreatedEvent) {
    this.logger.log(`Reserving stock for order ${payload.id}`);
    for (const item of payload.items) {
      await this.inventoryService.reserveForOrder(
        payload.id,
        item.productId,
        item.quantity,
      );
    }
  }

  @RabbitSubscribe(
    eventSubscribe('inventory.order.cancelled', Events.ORDER_CANCELLED),
  )
  async onOrderCancelled(payload: OrderCancelledEvent) {
    this.logger.log(`Releasing stock for order ${payload.id}`);
    for (const item of payload.items) {
      await this.inventoryService.releaseForOrder(
        payload.id,
        item.productId,
        item.quantity,
      );
    }
  }
}
