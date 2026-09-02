import { Module } from '@nestjs/common';
import { AuthModule, HealthModule, MessagingModule } from '@core-platform/common';
import { CartsModule } from './carts/carts.module';
import { DatabaseModule } from './database.module';

@Module({
  imports: [DatabaseModule, AuthModule, MessagingModule, HealthModule, CartsModule],
})
export class AppModule {}
