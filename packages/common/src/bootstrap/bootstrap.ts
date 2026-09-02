import { Logger, Type, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AllExceptionsFilter } from '../errors/http-exception.filter';

export async function bootstrapNestApp(
  AppModule: Type<unknown>,
  options: { defaultPort: number },
): Promise<void> {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new AllExceptionsFilter());

  const config = app.get(ConfigService);
  const port = config.get<string>('PORT') ?? options.defaultPort;
  await app.listen(port);
  Logger.log(`Application is running on: http://localhost:${port}/api`);
}
