import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OutboxModule } from '../outbox/outbox.module';
import { OutboxEvent, OutboxEventSchema } from '../outbox/schemas/outbox-event.schema';
import { Order, OrderSchema } from './schemas/order.schema';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { ProductCatalogService } from './product-catalog.service';

@Module({
  imports: [
    OutboxModule,
    MongooseModule.forFeature([
      { name: Order.name, schema: OrderSchema },
      { name: OutboxEvent.name, schema: OutboxEventSchema },
    ]),
  ],
  controllers: [OrdersController],
  providers: [OrdersService, ProductCatalogService],
})
export class OrdersModule {}
