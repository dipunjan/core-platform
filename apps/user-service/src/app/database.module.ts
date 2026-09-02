import { Module } from '@nestjs/common';
import { databaseImports } from '@core-platform/common';

@Module({
  imports: databaseImports({
    envFile: 'apps/user-service/.env',
    defaultMongoUri: 'mongodb://localhost:27017/users',
  }),
})
export class DatabaseModule {}
