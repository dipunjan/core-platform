import { plainToInstance } from 'class-transformer';
import { IsIn, IsOptional, IsString, MinLength, validateSync } from 'class-validator';

class EnvironmentVariables {
  @IsOptional()
  @IsIn(['development', 'production', 'test'])
  NODE_ENV?: string;

  @IsOptional()
  @IsString()
  MONGO_URI?: string;

  @IsOptional()
  @IsString()
  PORT?: string;

  @IsOptional()
  @IsString()
  RABBITMQ_URL?: string;

  @IsOptional()
  @IsString()
  REDIS_URL?: string;

  @IsString()
  @MinLength(16)
  JWT_SECRET!: string;

  @IsString()
  @MinLength(16)
  JWT_REFRESH_SECRET!: string;

  @IsOptional()
  @IsString()
  JWT_ACCESS_EXPIRES_IN?: string;

  @IsOptional()
  @IsString()
  JWT_REFRESH_EXPIRES_IN?: string;

  @IsOptional()
  @IsString()
  CORS_ORIGIN?: string;

  @IsOptional()
  @IsIn(['true', 'false'])
  COOKIE_SECURE?: string;
}

export function validateEnv(
  config: Record<string, unknown>,
): EnvironmentVariables {
  const validated = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validated, { skipMissingProperties: false });
  if (errors.length > 0) {
    throw new Error(errors.toString());
  }

  if ((validated.NODE_ENV ?? 'development') === 'production') {
    if (!validated.MONGO_URI) {
      throw new Error('MONGO_URI is required in production');
    }
    if (!validated.RABBITMQ_URL) {
      throw new Error('RABBITMQ_URL is required in production');
    }
    if (!validated.REDIS_URL) {
      throw new Error('REDIS_URL is required in production');
    }
    if (validated.JWT_SECRET.length < 32) {
      throw new Error('JWT_SECRET must be at least 32 characters in production');
    }
    if (validated.JWT_REFRESH_SECRET.length < 32) {
      throw new Error(
        'JWT_REFRESH_SECRET must be at least 32 characters in production',
      );
    }
    const cors = validated.CORS_ORIGIN?.trim();
    if (!cors || cors === '*') {
      throw new Error(
        'CORS_ORIGIN must be an explicit comma-separated origin list in production',
      );
    }
  }

  return validated;
}
