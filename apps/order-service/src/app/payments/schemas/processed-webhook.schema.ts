import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ProcessedWebhookDocument = HydratedDocument<ProcessedWebhook>;

@Schema({ timestamps: true })
export class ProcessedWebhook {
  @Prop({ required: true, unique: true })
  eventId!: string;

  @Prop({ required: true })
  provider!: string;
}

export const ProcessedWebhookSchema =
  SchemaFactory.createForClass(ProcessedWebhook);
