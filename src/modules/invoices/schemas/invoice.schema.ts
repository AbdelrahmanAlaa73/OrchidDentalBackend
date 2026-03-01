import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { DiscountType, InvoiceStatus } from '../../../enums';
import { InvoiceItem, InvoiceItemSchema } from './invoice-item.schema';

@Schema({ timestamps: true })
export class Invoice extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Patient', required: true })
  patientId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Doctor', required: true })
  doctorId: Types.ObjectId;

  @Prop({
    type: [InvoiceItemSchema],
    required: true,
    validate: {
      validator: (v: unknown[]) => v.length > 0,
      message: 'Invoice must have at least one item',
    },
  })
  items: InvoiceItem[];

  @Prop({ required: true, min: 0 })
  subtotal: number;

  @Prop({ required: true, min: 0, default: 0 })
  discount: number;

  @Prop({ required: true, enum: Object.values(DiscountType), default: DiscountType.Fixed })
  discountType: DiscountType;

  @Prop({ required: true, min: 0 })
  total: number;

  @Prop({ required: true, min: 0, default: 0 })
  paid: number;

  @Prop({ required: true, min: 0 })
  remaining: number;

  @Prop({ required: true, enum: Object.values(InvoiceStatus), default: InvoiceStatus.Unpaid })
  status: InvoiceStatus;

  @Prop({ default: 'EGP' })
  currency: string;

  @Prop()
  dueDate?: string;
}

export const InvoiceSchema = SchemaFactory.createForClass(Invoice);
InvoiceSchema.index({ patientId: 1 });
InvoiceSchema.index({ doctorId: 1 });
InvoiceSchema.index({ status: 1 });
InvoiceSchema.index({ createdAt: 1 });
