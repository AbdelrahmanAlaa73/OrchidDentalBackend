import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Prescription extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Patient', required: true })
  patientId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Appointment' })
  appointmentId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Doctor', required: true })
  doctorId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  medication: string;

  @Prop({ trim: true })
  strength?: string;

  @Prop({ trim: true })
  form?: string;

  @Prop({ required: true, trim: true })
  dosage: string;

  @Prop({ required: true, trim: true })
  duration: string;

  @Prop({ required: true })
  datePrescribed: string;

  @Prop()
  notes?: string;

  @Prop({ default: 'active' })
  status: string;
}

export const PrescriptionSchema = SchemaFactory.createForClass(Prescription);
PrescriptionSchema.index({ patientId: 1 });
PrescriptionSchema.index({ doctorId: 1, datePrescribed: -1 });
