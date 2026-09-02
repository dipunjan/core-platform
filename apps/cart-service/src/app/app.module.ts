import { Module } from '@nestjs/common';
import { HealthModule, MessagingModule } from '@core-platform/common';
import { CartsModule } from './carts/carts.module';
import { DatabaseModule } from './database.module';

@Module({
  imports: [DatabaseModule, MessagingModule, HealthModule, CartsModule],
})
export class AppModule {}
