import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ _id: false })
export class ExpenseSnapshot {
  @Prop({ required: true })
  expenseId: Types.ObjectId;

  @Prop({ required: true })
  category: string;

  @Prop({ required: true })
  categoryAr: string;

  @Prop()
  description?: string;

  @Prop({ required: true, min: 0 })
  amount: number;
}

const ExpenseSnapshotSchema = SchemaFactory.createForClass(ExpenseSnapshot);

@Schema({ timestamps: true })
export class DailyCloseout extends Document {
  @Prop({ required: true, unique: true })
  date: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  closedBy: Types.ObjectId;

  @Prop({ required: true, min: 0, default: 0 })
  cashCollected: number;

  @Prop({ required: true, min: 0, default: 0 })
  cardCollected: number;

  @Prop({ required: true, min: 0, default: 0 })
  transferCollected: number;

  @Prop({ required: true, min: 0, default: 0 })
  totalCollected: number;

  @Prop({ type: [ExpenseSnapshotSchema], default: [] })
  expenseSnapshot: ExpenseSnapshot[];

  @Prop({ required: true, min: 0, default: 0 })
  totalExpenses: number;

  @Prop({ required: true, default: 0 })
  finalBalance: number;

  @Prop({ required: true })
  closedAt: string;

  @Prop({ default: 'EGP' })
  currency: string;
}

export const DailyCloseoutSchema = SchemaFactory.createForClass(DailyCloseout);
