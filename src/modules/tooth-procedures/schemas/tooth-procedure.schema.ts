import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ToothProcedureType } from '../../../enums';

function validateFDITooth(v: number): boolean {
  const valid = new Set([11,12,13,14,15,16,17,18,21,22,23,24,25,26,27,28,31,32,33,34,35,36,37,38,41,42,43,44,45,46,47,48]);
  return valid.has(v);
}

@Schema({ timestamps: true })
export class ToothProcedure extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Patient', required: true })
  patientId: Types.ObjectId;

  @Prop({ required: true, validate: { validator: validateFDITooth, message: 'Invalid FDI tooth number' } })
  toothNumber: number;

  @Prop({ required: true })
  procedure: string;

  @Prop({ required: true })
  procedureAr: string;

  @Prop({ required: true, enum: Object.values(ToothProcedureType) })
  type: ToothProcedureType;

  @Prop({ required: true, min: 0 })
  price: number;

  @Prop({ required: true })
  date: string;

  @Prop({ type: Types.ObjectId, ref: 'Doctor', required: true })
  doctorId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Appointment' })
  appointmentId?: Types.ObjectId;

  @Prop()
  notes?: string;

  @Prop({ default: 'EGP' })
  currency: string;
}

export const ToothProcedureSchema = SchemaFactory.createForClass(ToothProcedure);
ToothProcedureSchema.index({ patientId: 1, toothNumber: 1 });
