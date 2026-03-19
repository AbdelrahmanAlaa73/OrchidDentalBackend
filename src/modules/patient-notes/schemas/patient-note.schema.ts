import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class PatientNote extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Patient', required: true })
  patientId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  content: string;
}

export const PatientNoteSchema = SchemaFactory.createForClass(PatientNote);
PatientNoteSchema.index({ patientId: 1 });
