import { Module } from '@nestjs/common';
import { AuthModule, HealthModule, MessagingModule } from '@core-platform/common';
import { DatabaseModule } from './database.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [DatabaseModule, AuthModule, MessagingModule, HealthModule, UsersModule],
})
export class AppModule {}
