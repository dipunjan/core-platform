import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { Controller, Get, Inject, Optional } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckService,
  HealthIndicatorFunction,
  HealthIndicatorResult,
  MongooseHealthIndicator,
} from '@nestjs/terminus';
import { SkipThrottle } from '@nestjs/throttler';
import type Redis from 'ioredis';
import { Public } from '../auth/public.decorator';
import { REDIS_CLIENT } from '../redis/redis.keys';

@SkipThrottle()
@Public()
@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly mongoose: MongooseHealthIndicator,
    @Optional() private readonly amqp?: AmqpConnection,
    @Optional() @Inject(REDIS_CLIENT) private readonly redis?: Redis,
  ) {}

  @Get('live')
  live() {
    return { status: 'ok' };
  }

  @Get()
  @HealthCheck()
  check() {
    return this.ready();
  }

  @Get('ready')
  @HealthCheck()
  ready() {
    const checks: HealthIndicatorFunction[] = [
      () => this.mongoose.pingCheck('mongodb'),
    ];
    if (this.amqp) {
      checks.push(async () => this.rabbitCheck());
    }
    if (this.redis) {
      checks.push(async () => this.redisCheck());
    }
    return this.health.check(checks);
  }

  private async redisCheck(): Promise<HealthIndicatorResult> {
    try {
      const pong = await this.redis?.ping();
      return {
        redis: {
          status: pong === 'PONG' ? 'up' : 'down',
        },
      };
    } catch {
      return {
        redis: {
          status: 'down',
        },
      };
    }
  }

  private rabbitCheck(): HealthIndicatorResult {
    const up = Boolean(this.amqp?.connected);
    return {
      rabbitmq: {
        status: up ? 'up' : 'down',
      },
    };
  }
}
