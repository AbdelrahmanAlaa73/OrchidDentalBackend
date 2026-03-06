import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { DoctorColor, DoctorRole } from '../../../enums';

@Schema({ timestamps: true })
export class Doctor extends Document {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, trim: true })
  nameAr: string;

  @Prop({ required: true, trim: true })
  specialty: string;

  @Prop({ required: true, trim: true })
  specialtyAr: string;

  @Prop({ required: true, enum: Object.values(DoctorColor) })
  color: DoctorColor;

  @Prop()
  avatar?: string;

  @Prop({ required: true, default: false })
  isOwner: boolean;

  @Prop({ required: true, enum: Object.values(DoctorRole) })
  role: DoctorRole;

  @Prop({ default: 20, min: 0, max: 100 })
  clinicSharePercent: number;

  @Prop({ default: 80, min: 0, max: 100 })
  doctorSharePercent: number;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  userId?: Types.ObjectId;
}

export const DoctorSchema = SchemaFactory.createForClass(Doctor);
