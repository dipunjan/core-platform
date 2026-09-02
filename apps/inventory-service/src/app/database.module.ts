import { Module } from '@nestjs/common';
import { databaseImports } from '@core-platform/common';

@Module({
  imports: databaseImports({
    envFile: 'apps/inventory-service/.env',
    defaultMongoUri: 'mongodb://localhost:27017/inventory',
  }),
})
export class DatabaseModule {}
