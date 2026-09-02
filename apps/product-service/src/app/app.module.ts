import { Module } from '@nestjs/common';
import { HealthModule, MessagingModule } from '@core-platform/common';
import { DatabaseModule } from './database.module';
import { ProductsModule } from './products/products.module';

@Module({
  imports: [DatabaseModule, MessagingModule, HealthModule, ProductsModule],
})
export class AppModule {}
