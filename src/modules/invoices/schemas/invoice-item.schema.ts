import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

function validateFDITooth(v: number): boolean {
  const valid = new Set([11,12,13,14,15,16,17,18,21,22,23,24,25,26,27,28,31,32,33,34,35,36,37,38,41,42,43,44,45,46,47,48]);
  return valid.has(v);
}

@Schema({ _id: true })
export class InvoiceItem extends Document {
  @Prop()
  description?: string;

  @Prop()
  descriptionAr?: string;

  @Prop({ required: true })
  procedure: string;

  @Prop({ required: true })
  procedureAr: string;

  @Prop({ min: 1, default: 1 })
  quantity: number;

  @Prop({ required: true, min: 0 })
  unitPrice: number;

  @Prop({ min: 0 })
  total?: number;

  @Prop({ validate: { validator: validateFDITooth, message: 'Invalid FDI tooth number' } })
  toothNumber?: number;
}

export const InvoiceItemSchema = SchemaFactory.createForClass(InvoiceItem);
