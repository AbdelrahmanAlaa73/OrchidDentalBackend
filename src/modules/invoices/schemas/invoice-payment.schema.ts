import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { PaymentMethod } from '../../../enums';

@Schema({ timestamps: true })
export class InvoicePayment extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Invoice', required: true })
  invoiceId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Patient', required: true })
  patientId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Doctor', required: true })
  doctorId: Types.ObjectId;

  @Prop({ required: true, min: 0.01 })
  amount: number;

  @Prop({ required: true, enum: Object.values(PaymentMethod) })
  method: PaymentMethod;

  @Prop({ required: true })
  paidAt: string;

  @Prop({ required: true })
  paidDate: string;

  @Prop({ required: true, min: 0 })
  beforeRemaining: number;

  @Prop({ required: true, min: 0 })
  afterRemaining: number;

  @Prop({ default: 'EGP' })
  currency: string;
}

export const InvoicePaymentSchema = SchemaFactory.createForClass(InvoicePayment);
InvoicePaymentSchema.index({ paidDate: 1 });
InvoicePaymentSchema.index({ invoiceId: 1 });
InvoicePaymentSchema.index({ doctorId: 1, paidDate: 1 });
