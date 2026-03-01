import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { UserRole } from '../../../enums';

@Schema({ timestamps: true })
export class User extends Document {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: true, select: false })
  passwordHash: string;

  @Prop({ required: true, enum: Object.values(UserRole) })
  role: UserRole;

  @Prop({ type: Types.ObjectId, ref: 'Doctor' })
  doctorId?: Types.ObjectId;

  @Prop({ type: [String], default: [] })
  permissions: string[];

  @Prop()
  avatar?: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
