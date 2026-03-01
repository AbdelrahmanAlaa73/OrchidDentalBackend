import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { AlertSeverity, AlertType } from '../../../enums';

@Schema({ timestamps: true })
export class MedicalAlert extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Patient', required: true })
  patientId: Types.ObjectId;

  @Prop({ required: true, enum: Object.values(AlertType) })
  type: AlertType;

  @Prop({ required: true, trim: true })
  description: string;

  @Prop({ required: true, enum: Object.values(AlertSeverity) })
  severity: AlertSeverity;
}

export const MedicalAlertSchema = SchemaFactory.createForClass(MedicalAlert);
MedicalAlertSchema.index({ patientId: 1 });
