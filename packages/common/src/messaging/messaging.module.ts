import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventPublisher } from './event-publisher';
import { EVENTS_EXCHANGE } from './events';

@Global()
@Module({
  imports: [
    RabbitMQModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>('RABBITMQ_URL') ?? 'amqp://localhost:5672',
        exchanges: [{ name: EVENTS_EXCHANGE, type: 'topic' as const }],
        connectionInitOptions: { wait: false },
        enableControllerDiscovery: true,
      }),
    }),
  ],
  providers: [EventPublisher],
  exports: [EventPublisher, RabbitMQModule],
})
export class MessagingModule {}
