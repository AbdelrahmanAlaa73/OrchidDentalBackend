import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { WaitingUrgency } from '../../../enums';

@Schema({ timestamps: true })
export class WaitingListItem extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Patient', required: true })
  patientId: Types.ObjectId;

  @Prop({ required: true })
  preferredDate: string;

  @Prop()
  preferredTimeRange?: string;

  @Prop({ required: true, enum: Object.values(WaitingUrgency), default: WaitingUrgency.Medium })
  urgency: WaitingUrgency;

  @Prop()
  notes?: string;

  @Prop({ min: 10, max: 240 })
  duration?: number;
}

export const WaitingListItemSchema = SchemaFactory.createForClass(WaitingListItem);
WaitingListItemSchema.index({ preferredDate: 1, urgency: 1 });
