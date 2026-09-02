import { MessageHandlerErrorBehavior } from '@golevelup/nestjs-rabbitmq';
import { DLX_EXCHANGE, EVENTS_EXCHANGE, EventName } from './events';

export function eventSubscribe(queue: string, routingKey: EventName) {
  return {
    exchange: EVENTS_EXCHANGE,
    routingKey,
    queue,
    createQueueIfNotExists: true,
    queueOptions: {
      durable: true,
      deadLetterExchange: DLX_EXCHANGE,
    },
    errorBehavior: MessageHandlerErrorBehavior.NACK,
  };
}
