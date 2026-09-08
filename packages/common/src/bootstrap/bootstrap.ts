import { Logger, Type, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { corsOrigins } from '../http/cors';

export type BootstrapOptions = {
  defaultPort: number;
  /** Shown in OpenAPI title, e.g. "user-service". */
  serviceName?: string;
  /** Keep raw body on `req.rawBody` for payment webhook signature verification. */
  rawBody?: boolean;
};

export async function bootstrapNestApp(
  AppModule: Type<unknown>,
  options: BootstrapOptions,
): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    rawBody: options.rawBody ?? false,
  });
  app.enableShutdownHooks();
  app.setGlobalPrefix('api');
  app.use(helmet());

  const config = app.get(ConfigService);
  if (
    config.get<string>('TRUST_PROXY') === 'true' ||
    config.get<string>('NODE_ENV') === 'production'
  ) {
    app.set('trust proxy', 1);
  }
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

  const title = options.serviceName ?? 'Core Platform API';
  const swagger = new DocumentBuilder()
    .setTitle(title)
    .setDescription('REST API for the swoop e-commerce platform.')
    .setVersion('1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'access-token',
    )
    .build();
  const document = SwaggerModule.createDocument(app, swagger);
  SwaggerModule.setup('api/docs', app, document);

  const port = config.get<string>('PORT') ?? options.defaultPort;
  await app.listen(port);
  Logger.log(`Application is running on: http://localhost:${port}/api`);
  Logger.log(`OpenAPI docs: http://localhost:${port}/api/docs`);
}
