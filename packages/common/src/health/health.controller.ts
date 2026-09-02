import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { Controller, Get, Optional } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckService,
  HealthIndicatorFunction,
  HealthIndicatorResult,
  MongooseHealthIndicator,
} from '@nestjs/terminus';

@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly mongoose: MongooseHealthIndicator,
    @Optional() private readonly amqp?: AmqpConnection,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    const checks: HealthIndicatorFunction[] = [
      () => this.mongoose.pingCheck('mongodb'),
    ];
    if (this.amqp) {
      checks.push(async () => this.rabbitCheck());
    }
    return this.health.check(checks);
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
