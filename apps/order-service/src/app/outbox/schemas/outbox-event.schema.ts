import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type OutboxEventDocument = HydratedDocument<OutboxEvent>;

@Schema({ timestamps: true })
export class OutboxEvent {
  @Prop({ required: true })
  routingKey!: string;

  @Prop({ type: Object, required: true })
  payload!: Record<string, unknown>;

  @Prop({ default: null })
  publishedAt?: Date | null;

  @Prop({ default: 0 })
  attempts!: number;

  @Prop()
  lastError?: string;

  @Prop()
  aggregateId?: string;
}

export const OutboxEventSchema = SchemaFactory.createForClass(OutboxEvent);
OutboxEventSchema.index({ publishedAt: 1, createdAt: 1 });
