import { Module } from '@nestjs/common';
import { databaseImports } from '@core-platform/common';

@Module({
  imports: databaseImports({
    envFile: 'apps/order-service/.env',
    defaultMongoUri: 'mongodb://localhost:27017/orders',
  }),
})
export class DatabaseModule {}
