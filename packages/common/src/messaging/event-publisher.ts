import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { Injectable, Logger } from '@nestjs/common';
import { EVENTS_EXCHANGE, EventName } from './events';

@Injectable()
export class EventPublisher {
  private readonly logger = new Logger(EventPublisher.name);

  constructor(private readonly amqp: AmqpConnection) {}

  async publish<T>(routingKey: EventName, payload: T): Promise<void> {
    const waits = [0, 200, 500];
    let lastError: unknown;
    for (const waitMs of waits) {
      if (waitMs > 0) {
        await sleep(waitMs);
      }
      try {
        await this.amqp.publish(EVENTS_EXCHANGE, routingKey, payload);
        this.logger.debug(`Published ${routingKey}`);
        return;
      } catch (err) {
        lastError = err;
        this.logger.warn(`Publish ${routingKey} failed (${String(err)})`);
      }
    }
    throw lastError;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
