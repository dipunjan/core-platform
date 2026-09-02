import { Module } from '@nestjs/common';
import { databaseImports } from '@core-platform/common';

@Module({
  imports: databaseImports({
    envFile: 'apps/product-service/.env',
    defaultMongoUri: 'mongodb://localhost:27017/products',
  }),
})
export class DatabaseModule {}
