import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { PatientTransfer } from './schemas/patient-transfer.schema';
import { Patient } from '../patients/schemas/patient.schema';

@Injectable()
export class PatientTransfersService {
  constructor(
    @InjectModel(PatientTransfer.name) private patientTransferModel: Model<PatientTransfer>,
    @InjectModel(Patient.name) private patientModel: Model<Patient>,
  ) {}

  async transfer(patientId: string, toDoctorId: string, reason: string, notes: string | undefined, userId: string) {
    const patient = await this.patientModel.findById(patientId);
    if (!patient) throw new NotFoundException('Patient not found');
    const fromDoctorId = patient.assignedDoctorId;
    if (!fromDoctorId) throw new NotFoundException('Patient has no assigned doctor to transfer from');
    const transfer = await this.patientTransferModel.create({
      patientId: new Types.ObjectId(patientId),
      fromDoctorId,
      toDoctorId: new Types.ObjectId(toDoctorId),
      reason,
      notes,
      transferredAt: new Date().toISOString(),
      transferredBy: new Types.ObjectId(userId),
    });
    await this.patientModel.findByIdAndUpdate(patientId, { assignedDoctorId: new Types.ObjectId(toDoctorId) });
    return this.patientTransferModel.findById(transfer._id).populate('fromDoctorId toDoctorId transferredBy', 'name nameAr email').lean();
  }

  async findByPatient(patientId: string) {
    return this.patientTransferModel.find({ patientId: new Types.ObjectId(patientId) }).populate('fromDoctorId toDoctorId transferredBy', 'name nameAr email').sort({ transferredAt: -1 }).lean();
  }
}
