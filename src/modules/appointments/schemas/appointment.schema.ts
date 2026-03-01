import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { AppointmentStatus, BillingMode } from '../../../enums';
import { addMinutesToTime } from '../../../common/utils/fdi.validator';

function validateFDITooth(v: number): boolean {
  const valid = new Set([11,12,13,14,15,16,17,18,21,22,23,24,25,26,27,28,31,32,33,34,35,36,37,38,41,42,43,44,45,46,47,48]);
  return valid.has(v);
}

@Schema({ timestamps: true })
export class Appointment extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Patient', required: true })
  patientId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Doctor', required: true })
  doctorId: Types.ObjectId;

  @Prop({ enum: Object.values(BillingMode) })
  billingMode?: BillingMode;

  @Prop({ required: true })
  date: string;

  @Prop({ required: true })
  startTime: string;

  @Prop({ required: true })
  endTime: string;

  @Prop({ required: true, min: 10, max: 240 })
  duration: number;

  @Prop({ required: true, enum: Object.values(AppointmentStatus), default: AppointmentStatus.Scheduled })
  status: AppointmentStatus;

  @Prop()
  procedure?: string;

  @Prop()
  procedureAr?: string;

  @Prop()
  notes?: string;

  @Prop({ default: 0, min: 0 })
  sterilizationBuffer: number;

  @Prop({ validate: { validator: validateFDITooth, message: 'Invalid FDI tooth number' } })
  toothNumber?: number;

  @Prop({ default: false })
  treatmentAdded: boolean;
}

export const AppointmentSchema = SchemaFactory.createForClass(Appointment);
AppointmentSchema.index({ date: 1, doctorId: 1 });
AppointmentSchema.index({ patientId: 1 });
AppointmentSchema.pre('save', function (next) {
  if (this.isModified('startTime') || this.isModified('duration')) {
    this.endTime = addMinutesToTime(this.startTime, this.duration);
  }
  next();
});
