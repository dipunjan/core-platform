import { Module } from '@nestjs/common';
import { AuthModule, HealthModule } from '@core-platform/common';
import { CartsModule } from './carts/carts.module';
import { DatabaseModule } from './database.module';

@Module({
  imports: [DatabaseModule, AuthModule, HealthModule, CartsModule],
})
export class AppModule {}
