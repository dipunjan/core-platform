import { Module } from '@nestjs/common';
import { HealthModule, MessagingModule } from '@core-platform/common';
import { DatabaseModule } from './database.module';
import { InventoryModule } from './inventory/inventory.module';

@Module({
  imports: [DatabaseModule, MessagingModule, HealthModule, InventoryModule],
})
export class AppModule {}
