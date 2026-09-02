import { MessageHandlerErrorBehavior, RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventPublisher } from './event-publisher';
import { DLQ_QUEUE, DLX_EXCHANGE, EVENTS_EXCHANGE } from './events';

@Global()
@Module({
  imports: [
    RabbitMQModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>('RABBITMQ_URL') ?? 'amqp://localhost:5672',
        prefetchCount: 1,
        defaultSubscribeErrorBehavior: MessageHandlerErrorBehavior.NACK,
        defaultPublishOptions: { persistent: true },
        connectionInitOptions: { wait: false },
        connectionManagerOptions: {
          heartbeatIntervalInSeconds: 5,
          reconnectTimeInSeconds: 3,
        },
        enableControllerDiscovery: true,
        exchanges: [
          {
            name: EVENTS_EXCHANGE,
            type: 'topic' as const,
            options: { durable: true },
          },
          {
            name: DLX_EXCHANGE,
            type: 'fanout' as const,
            options: { durable: true },
          },
        ],
        queues: [
          {
            name: DLQ_QUEUE,
            exchange: DLX_EXCHANGE,
            createQueueIfNotExists: true,
            options: { durable: true },
          },
        ],
      }),
    }),
  ],
  providers: [EventPublisher],
  exports: [EventPublisher, RabbitMQModule],
})
export class MessagingModule {}
