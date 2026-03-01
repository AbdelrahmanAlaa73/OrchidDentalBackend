import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class PatientTransfer extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Patient', required: true })
  patientId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Doctor', required: true })
  fromDoctorId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Doctor', required: true })
  toDoctorId: Types.ObjectId;

  @Prop({ required: true })
  reason: string;

  @Prop()
  notes?: string;

  @Prop({ required: true })
  transferredAt: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  transferredBy: Types.ObjectId;
}

export const PatientTransferSchema = SchemaFactory.createForClass(PatientTransfer);
PatientTransferSchema.index({ patientId: 1 });
