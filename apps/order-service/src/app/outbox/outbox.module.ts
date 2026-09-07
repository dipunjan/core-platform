import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OutboxRelayService } from './outbox-relay.service';
import { OutboxEvent, OutboxEventSchema } from './schemas/outbox-event.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: OutboxEvent.name, schema: OutboxEventSchema },
    ]),
  ],
  providers: [OutboxRelayService],
  exports: [MongooseModule],
})
export class OutboxModule {}
