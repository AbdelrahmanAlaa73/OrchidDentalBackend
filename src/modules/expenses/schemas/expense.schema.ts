import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ExpenseCategory } from '../../../enums';

@Schema({ timestamps: true })
export class Expense extends Document {
  @Prop({ required: true, enum: Object.values(ExpenseCategory) })
  category: ExpenseCategory;

  @Prop({ required: true })
  categoryAr: string;

  @Prop()
  description?: string;

  @Prop({ required: true, min: 0.01 })
  amount: number;

  @Prop({ required: true })
  date: string;

  @Prop()
  receiptUrl?: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy: Types.ObjectId;

  @Prop({ default: 'EGP' })
  currency: string;
}

export const ExpenseSchema = SchemaFactory.createForClass(Expense);
ExpenseSchema.index({ date: 1 });
ExpenseSchema.index({ createdBy: 1 });
