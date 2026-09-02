import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { Injectable, Logger } from '@nestjs/common';
import { EVENTS_EXCHANGE, EventName } from './events';

@Injectable()
export class EventPublisher {
  private readonly logger = new Logger(EventPublisher.name);

  constructor(private readonly amqp: AmqpConnection) {}

  async publish<T>(routingKey: EventName, payload: T): Promise<void> {
    await this.amqp.publish(EVENTS_EXCHANGE, routingKey, payload, {
      persistent: true,
    });
    this.logger.debug(`Published ${routingKey}`);
  }
}
