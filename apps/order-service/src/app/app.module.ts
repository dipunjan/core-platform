import { Module } from '@nestjs/common';
import { HealthModule, MessagingModule } from '@core-platform/common';
import { DatabaseModule } from './database.module';
import { OrdersModule } from './orders/orders.module';

@Module({
  imports: [DatabaseModule, MessagingModule, HealthModule, OrdersModule],
})
export class AppModule {}
