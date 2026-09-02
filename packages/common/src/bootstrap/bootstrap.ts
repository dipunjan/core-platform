import { Logger, Type, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import { corsOrigins } from '../http/cors';

export async function bootstrapNestApp(
  AppModule: Type<unknown>,
  options: { defaultPort: number },
): Promise<void> {
  const app = await NestFactory.create(AppModule);
  app.enableShutdownHooks();
  app.setGlobalPrefix('api');
  app.use(helmet());

  const config = app.get(ConfigService);
  app.enableCors({
    origin: corsOrigins(
      config.get<string>('CORS_ORIGIN'),
      config.get<string>('NODE_ENV'),
    ),
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = config.get<string>('PORT') ?? options.defaultPort;
  await app.listen(port);
  Logger.log(`Application is running on: http://localhost:${port}/api`);
}
