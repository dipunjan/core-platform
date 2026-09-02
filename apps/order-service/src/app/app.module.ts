import { Module } from '@nestjs/common';
import { AuthModule, HealthModule, MessagingModule } from '@core-platform/common';
import { DatabaseModule } from './database.module';
import { OrdersModule } from './orders/orders.module';

@Module({
  imports: [DatabaseModule, AuthModule, MessagingModule, HealthModule, OrdersModule],
})
export class AppModule {}
