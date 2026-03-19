import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { toObjectIdOrThrow, toObjectIdOrUndefined } from '../../common/utils/objectid';
import { Prescription } from './schemas/prescription.schema';
import { CreatePrescriptionDto } from './dto/create-prescription.dto';
import { UpdatePrescriptionDto } from './dto/update-prescription.dto';

@Injectable()
export class PrescriptionsService {
  constructor(@InjectModel(Prescription.name) private prescriptionModel: Model<Prescription>) {}

  async findByPatient(patientId: string) {
    return this.prescriptionModel
      .find({ patientId: toObjectIdOrThrow(patientId, 'patientId') })
      .populate('doctorId', 'name nameAr')
      .populate('appointmentId', 'date startTime')
      .sort({ datePrescribed: -1 })
      .lean();
  }

  async create(patientId: string, dto: CreatePrescriptionDto) {
    const appointmentId = dto.appointmentId ? toObjectIdOrUndefined(dto.appointmentId) : undefined;
    if (dto.appointmentId && !appointmentId) {
      throw new BadRequestException('appointmentId must be a valid MongoDB ObjectId (24 hex characters)');
    }
    const prescription = await this.prescriptionModel.create({
      patientId: toObjectIdOrThrow(patientId, 'patientId'),
      doctorId: toObjectIdOrThrow(dto.doctorId, 'doctorId'),
      appointmentId,
      medication: dto.medication,
      strength: dto.strength,
      form: dto.form,
      dosage: dto.dosage,
      duration: dto.duration,
      datePrescribed: dto.datePrescribed,
      notes: dto.notes,
      status: dto.status ?? 'active',
    });
    return this.prescriptionModel
      .findById(prescription._id)
      .populate('doctorId', 'name nameAr')
      .populate('appointmentId', 'date startTime')
      .lean();
  }

  async findOne(patientId: string, prescriptionId: string) {
    const prescription = await this.prescriptionModel
      .findOne({
        _id: toObjectIdOrThrow(prescriptionId, 'prescriptionId'),
        patientId: toObjectIdOrThrow(patientId, 'patientId'),
      })
      .populate('doctorId', 'name nameAr')
      .populate('appointmentId', 'date startTime')
      .lean();
    if (!prescription) throw new NotFoundException('Prescription not found');
    return prescription;
  }

  async update(patientId: string, prescriptionId: string, dto: UpdatePrescriptionDto) {
    const prescription = await this.prescriptionModel.findOneAndUpdate(
      {
        _id: toObjectIdOrThrow(prescriptionId, 'prescriptionId'),
        patientId: toObjectIdOrThrow(patientId, 'patientId'),
      },
      { $set: dto },
      { new: true },
    )
      .populate('doctorId', 'name nameAr')
      .populate('appointmentId', 'date startTime')
      .lean();
    if (!prescription) throw new NotFoundException('Prescription not found');
    return prescription;
  }

  async remove(patientId: string, prescriptionId: string) {
    const deleted = await this.prescriptionModel.findOneAndDelete({
      _id: toObjectIdOrThrow(prescriptionId, 'prescriptionId'),
      patientId: toObjectIdOrThrow(patientId, 'patientId'),
    });
    if (!deleted) throw new NotFoundException('Prescription not found');
  }

  async deleteByPatient(patientId: string) {
    await this.prescriptionModel.deleteMany({ patientId: toObjectIdOrThrow(patientId, 'patientId') });
  }
}
