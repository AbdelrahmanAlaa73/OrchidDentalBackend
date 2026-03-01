import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ _id: false })
export class WorkingHoursDay {
  @Prop()
  open: string;

  @Prop()
  close: string;

  @Prop()
  isOpen: boolean;
}

const WorkingHoursDaySchema = SchemaFactory.createForClass(WorkingHoursDay);

@Schema({ timestamps: true })
export class ClinicSettings extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  nameAr: string;

  @Prop()
  address?: string;

  @Prop()
  phone?: string;

  @Prop()
  email?: string;

  @Prop({ type: Map, of: WorkingHoursDaySchema })
  workingHours: Map<string, WorkingHoursDay>;

  @Prop({ type: [Number], default: [15, 30, 45, 60, 90] })
  appointmentDurations: number[];

  @Prop({ default: 0, min: 0 })
  sterilizationBuffer: number;

  @Prop({ default: 20, min: 0, max: 100 })
  clinicSharePercentage: number;

  @Prop({ default: 'EGP' })
  currency: string;
}

export const ClinicSettingsSchema = SchemaFactory.createForClass(ClinicSettings);
