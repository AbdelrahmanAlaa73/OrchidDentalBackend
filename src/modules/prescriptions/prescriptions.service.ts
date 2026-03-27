import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { toObjectIdOrThrow, toObjectIdOrUndefined } from '../../common/utils/objectid';
import { Prescription } from './schemas/prescription.schema';
import { CreatePrescriptionDto } from './dto/create-prescription.dto';
import { UpdatePrescriptionDto } from './dto/update-prescription.dto';

type PrescriptionLean = Record<string, unknown> & {
  _id: Types.ObjectId;
  patientId: Types.ObjectId;
  datePrescribed: string;
  medication: string;
  createdAt?: Date;
};

@Injectable()
export class PrescriptionsService {
  constructor(@InjectModel(Prescription.name) private prescriptionModel: Model<Prescription>) {}

  async findById(id: string, includeHistory?: boolean) {
    const prescription = (await this.prescriptionModel
      .findById(toObjectIdOrThrow(id, 'id'))
      .populate('doctorId', 'name nameAr')
      .populate('appointmentId', 'date startTime')
      .lean()) as PrescriptionLean | null;
    if (!prescription) throw new NotFoundException('Prescription not found');
    if (includeHistory) {
      const priorPrescriptions = await this.findPriorForDocument(prescription, false);
      return { prescription, priorPrescriptions };
    }
    return prescription;
  }

  async updateById(id: string, dto: UpdatePrescriptionDto) {
    const prescription = await this.prescriptionModel
      .findByIdAndUpdate(toObjectIdOrThrow(id, 'id'), { $set: dto }, { new: true })
      .populate('doctorId', 'name nameAr')
      .populate('appointmentId', 'date startTime')
      .lean();
    if (!prescription) throw new NotFoundException('Prescription not found');
    return prescription;
  }

  async removeById(id: string) {
    const deleted = await this.prescriptionModel.findByIdAndDelete(toObjectIdOrThrow(id, 'id'));
    if (!deleted) throw new NotFoundException('Prescription not found');
  }

  /** Prior prescriptions for the same patient, strictly before this one (by datePrescribed, then createdAt). */
  async getPriorPrescriptions(prescriptionId: string, options?: { sameMedication?: boolean }) {
    const current = (await this.prescriptionModel.findById(toObjectIdOrThrow(prescriptionId, 'id')).lean()) as PrescriptionLean | null;
    if (!current) throw new NotFoundException('Prescription not found');
    return this.findPriorForDocument(current, options?.sameMedication ?? false);
  }

  private async findPriorForDocument(current: PrescriptionLean, sameMedication: boolean) {
    const dateStr = current.datePrescribed;
    const createdAt = current.createdAt;
    const orConditions: Record<string, unknown>[] = [{ datePrescribed: { $lt: dateStr } }];
    if (createdAt) {
      orConditions.push({
        $and: [{ datePrescribed: dateStr }, { createdAt: { $lt: createdAt } }],
      });
    }
    const filter: Record<string, unknown> = {
      patientId: current.patientId,
      _id: { $ne: current._id },
      $or: orConditions,
    };
    if (sameMedication) {
      const escaped = current.medication.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.medication = new RegExp(`^${escaped}$`, 'i');
    }
    return this.prescriptionModel
      .find(filter)
      .populate('doctorId', 'name nameAr')
      .populate('appointmentId', 'date startTime')
      .sort({ datePrescribed: -1, createdAt: -1 })
      .lean();
  }

  async findByPatient(patientId: string) {
    return this.prescriptionModel
      .find({ patientId: toObjectIdOrThrow(patientId, 'patientId') })
      .populate('doctorId', 'name nameAr')
      .populate('appointmentId', 'date startTime')
      .sort({ datePrescribed: -1 })
      .lean();
  }

  async findAll(patientId?: string) {
    const filter = patientId?.trim()
      ? { patientId: toObjectIdOrThrow(patientId.trim(), 'patientId') }
      : {};

    return this.prescriptionModel
      .find(filter)
      .populate('doctorId', 'name nameAr')
      .populate('appointmentId', 'date startTime')
      .sort({ datePrescribed: -1, createdAt: -1 })
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
