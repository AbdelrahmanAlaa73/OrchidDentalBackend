import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { PatientGender } from '../../../enums';

@Schema({ timestamps: true })
export class Patient extends Document {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, trim: true })
  nameAr: string;

  @Prop({ required: true, trim: true })
  phone: string;

  @Prop({ min: 0, max: 150 })
  age?: number;

  @Prop({ lowercase: true, trim: true })
  email?: string;

  @Prop()
  dateOfBirth?: string;

  @Prop({ required: true, enum: Object.values(PatientGender) })
  gender: PatientGender;

  @Prop()
  notes?: string;

  @Prop()
  lastVisit?: string;

  @Prop({ type: Types.ObjectId, ref: 'Doctor' })
  assignedDoctorId?: Types.ObjectId;

  @Prop({ default: false })
  hasCompletedOnboarding: boolean;

  @Prop()
  job?: string;

  @Prop()
  address?: string;

  @Prop({
    type: {
      diabetes: Boolean,
      heartDisease: Boolean,
      bloodPressure: Boolean,
      hepatitis: Boolean,
      kidneyDisease: Boolean,
      allergies: Boolean,
      other: Boolean,
    },
  })
  medicalConditions?: Record<string, boolean>;

  @Prop({
    type: {
      takingMedication: { type: String, enum: ['yes', 'no'] },
      pregnant: { type: String, enum: ['yes', 'no', 'n/a'] },
      smoking: { type: String, enum: ['yes', 'no'] },
    },
  })
  questionnaire?: Record<string, string>;
}

export const PatientSchema = SchemaFactory.createForClass(Patient);
PatientSchema.index({ phone: 1 });
PatientSchema.index({ name: 'text', nameAr: 'text' });
