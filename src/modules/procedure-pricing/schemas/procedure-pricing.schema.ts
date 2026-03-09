import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { ToothProcedureType, ProcedureCategory } from '../../../enums';

@Schema({ timestamps: true })
export class ProcedurePricing extends Document {
  @Prop({ required: true, unique: true, trim: true })
  procedure: string;

  @Prop({ required: true, trim: true })
  procedureAr: string;

  @Prop({ required: true, min: 0 })
  basePrice: number;

  @Prop({ enum: Object.values(ToothProcedureType) })
  type?: ToothProcedureType;

  @Prop({ enum: Object.values(ProcedureCategory) })
  procedureType?: ProcedureCategory;
}

export const ProcedurePricingSchema = SchemaFactory.createForClass(ProcedurePricing);
