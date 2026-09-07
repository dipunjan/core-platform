import { EventPublisher, type EventName } from '@core-platform/common';
import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  OutboxEvent,
  type OutboxEventDocument,
} from './schemas/outbox-event.schema';

@Injectable()
export class OutboxRelayService implements OnModuleInit, OnModuleDestroy {
  private readonly log = new Logger(OutboxRelayService.name);
  private timer?: NodeJS.Timeout;
  private running = false;

  constructor(
    @InjectModel(OutboxEvent.name)
    private readonly outboxModel: Model<OutboxEvent>,
    private readonly events: EventPublisher,
    private readonly config: ConfigService,
  ) {}

  onModuleInit() {
    const ms = Number(this.config.get<string>('OUTBOX_POLL_MS') ?? 2000);
    this.timer = setInterval(() => void this.tick(), ms);
    void this.tick();
  }

  onModuleDestroy() {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }

  private async tick() {
    if (this.running) {
      return;
    }
    this.running = true;
    try {
      const pending = await this.outboxModel
        .find({ publishedAt: null })
        .sort({ createdAt: 1 })
        .limit(20)
        .exec();

      for (const row of pending) {
        await this.publishRow(row);
      }
    } catch (err) {
      this.log.warn(`Outbox relay tick failed (${String(err)})`);
    } finally {
      this.running = false;
    }
  }

  private async publishRow(row: OutboxEventDocument) {
    try {
      await this.events.publish(
        row.routingKey as EventName,
        row.payload,
      );
      row.publishedAt = new Date();
      row.lastError = undefined;
      await row.save();
    } catch (err) {
      row.attempts += 1;
      row.lastError = String(err);
      await row.save();
      this.log.warn(
        `Outbox ${String(row._id)} publish failed (attempt ${row.attempts})`,
      );
    }
  }
}
