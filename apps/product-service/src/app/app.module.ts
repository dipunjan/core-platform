import { Module } from '@nestjs/common';
import { AuthModule, HealthModule, MessagingModule } from '@core-platform/common';
import { DatabaseModule } from './database.module';
import { ProductsModule } from './products/products.module';

@Module({
  imports: [DatabaseModule, AuthModule, MessagingModule, HealthModule, ProductsModule],
})
export class AppModule {}
