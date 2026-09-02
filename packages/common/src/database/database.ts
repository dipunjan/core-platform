import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { join } from 'path';
import { validateEnv } from '../config/env.validation';

export function databaseImports(options: {
  envFile: string;
  defaultMongoUri: string;
}) {
  return [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        join(process.cwd(), options.envFile),
        join(process.cwd(), '.env'),
      ],
      validate: validateEnv,
    }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>('MONGO_URI') ?? options.defaultMongoUri,
      }),
    }),
  ];
}
