import { Module } from '@nestjs/common';
import { AuthModule, HealthModule, MessagingModule } from '@core-platform/common';
import { DatabaseModule } from './database.module';
import { ProductsModule } from './products/products.module';
import { StorefrontModule } from './storefront/storefront.module';

@Module({
  imports: [
    DatabaseModule,
    AuthModule,
    MessagingModule,
    HealthModule,
    ProductsModule,
    StorefrontModule,
  ],
})
export class AppModule {}
