import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class ProcedurePricing extends Document {
  @Prop({ required: true, unique: true, trim: true })
  procedure: string;

  @Prop({ required: true, trim: true })
  procedureAr: string;

  @Prop({ required: true, min: 0 })
  basePrice: number;

  @Prop({ required: true, min: 0, max: 100 })
  doctorPercent: number;

  @Prop({ required: true, min: 0, max: 100 })
  clinicPercent: number;

  @Prop({ required: true, min: 0, max: 100, default: 0 })
  maxDiscount: number;
}

export const ProcedurePricingSchema = SchemaFactory.createForClass(ProcedurePricing);
