import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { MedicalAlert } from './schemas/medical-alert.schema';

@Injectable()
export class MedicalAlertsService {
  constructor(@InjectModel(MedicalAlert.name) private medicalAlertModel: Model<MedicalAlert>) {}

  async findByPatient(patientId: string) {
    return this.medicalAlertModel.find({ patientId: new Types.ObjectId(patientId) }).sort({ createdAt: -1 }).lean();
  }

  async create(patientId: string, body: { type: string; description: string; severity: string }) {
    const alert = await this.medicalAlertModel.create({
      patientId: new Types.ObjectId(patientId),
      ...body,
    });
    return alert.toObject();
  }

  async remove(id: string) {
    const deleted = await this.medicalAlertModel.findByIdAndDelete(id);
    if (!deleted) throw new NotFoundException('Medical alert not found');
  }
}
