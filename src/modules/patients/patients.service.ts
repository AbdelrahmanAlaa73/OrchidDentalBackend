import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { toObjectIdOrThrow, toObjectIdOrUndefined } from '../../common/utils/objectid';
import { Patient } from './schemas/patient.schema';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { Appointment } from '../appointments/schemas/appointment.schema';
import { Invoice } from '../invoices/schemas/invoice.schema';
import { ToothProcedure } from '../tooth-procedures/schemas/tooth-procedure.schema';
import { MedicalAlert } from '../medical-alerts/schemas/medical-alert.schema';
import { PatientNotesService } from '../patient-notes/patient-notes.service';
import { PrescriptionsService } from '../prescriptions/prescriptions.service';

@Injectable()
export class PatientsService {
  constructor(
    @InjectModel(Patient.name) private patientModel: Model<Patient>,
    @InjectModel(Appointment.name) private appointmentModel: Model<Appointment>,
    @InjectModel(Invoice.name) private invoiceModel: Model<Invoice>,
    @InjectModel(ToothProcedure.name) private toothProcedureModel: Model<ToothProcedure>,
    @InjectModel(MedicalAlert.name) private medicalAlertModel: Model<MedicalAlert>,
    private patientNotesService: PatientNotesService,
    private prescriptionsService: PrescriptionsService,
  ) {}

  /** Get patients with dateOfBirth set. Optional date (YYYY-MM-DD) filters to birthdays on that month-day. */
  async findBirthdays(date?: string): Promise<Record<string, unknown>[]> {
    const filter: Record<string, unknown> = { dateOfBirth: { $exists: true, $ne: '' } };
    if (date?.trim()) {
      const monthDay = date.length >= 10 ? date.slice(5, 10) : date; // YYYY-MM-DD -> MM-DD
      filter.dateOfBirth = { $regex: new RegExp(`^\\d{4}-${monthDay}$`) };
    }
    const patients = await this.patientModel
      .find(filter)
      .select('_id name nameAr dateOfBirth phone assignedDoctorId')
      .populate('assignedDoctorId', 'name nameAr')
      .sort({ dateOfBirth: 1 })
      .lean();
    return patients.map((p) => ({
      id: (p as { _id?: unknown })._id != null ? String((p as { _id: Types.ObjectId })._id) : undefined,
      name: (p as { name?: string }).name,
      nameAr: (p as { nameAr?: string }).nameAr,
      dateOfBirth: (p as { dateOfBirth?: string }).dateOfBirth,
      phone: (p as { phone?: string }).phone,
      assignedDoctorId: (p as { assignedDoctorId?: unknown }).assignedDoctorId,
    }));
  }

  async findAll(query: { search?: string; assignedDoctorId?: string; page?: number; limit?: number }) {
    const filter: Record<string, unknown> = {};
    const doctorId = toObjectIdOrUndefined(query.assignedDoctorId);
    if (doctorId) filter.assignedDoctorId = doctorId;

    const searchTrimmed = query.search?.trim();
    const SINGLE_LETTER_LIMIT = 20;

    if (searchTrimmed) {
      if (searchTrimmed.length === 1) {
        const escaped = searchTrimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const re = new RegExp(escaped, 'i');
        filter.$or = [
          { name: re },
          { nameAr: re },
          { phone: { $regex: escaped } },
        ];
      } else {
        filter.$text = { $search: searchTrimmed };
      }
    }

    const page = Math.max(1, query.page || 1);
    const effectiveLimit =
      searchTrimmed?.length === 1 ? Math.min(SINGLE_LETTER_LIMIT, Math.max(1, query.limit || 20)) : Math.min(100, Math.max(1, query.limit || 20));
    const skip = (page - 1) * effectiveLimit;
    const [items, total] = await Promise.all([
      this.patientModel.find(filter).skip(skip).limit(effectiveLimit).sort({ createdAt: -1 }).populate('assignedDoctorId', 'name nameAr specialty color').lean(),
      this.patientModel.countDocuments(filter),
    ]);
    return { items, total, page, limit: effectiveLimit };
  }

  async create(dto: CreatePatientDto) {
    const assignedDoctorId = toObjectIdOrUndefined(dto.assignedDoctorId);
    if (dto.assignedDoctorId && !assignedDoctorId) {
      throw new BadRequestException('assignedDoctorId must be a valid MongoDB ObjectId (24 hex characters). Get doctor IDs from GET /api/doctors');
    }
    const patient = await this.patientModel.create({
      ...dto,
      assignedDoctorId,
    });
    return patient.toObject();
  }

  async findOne(id: string): Promise<Record<string, unknown>> {
    const patientId = toObjectIdOrThrow(id, 'id');
    const patient = await this.patientModel
      .findById(patientId)
      .populate('assignedDoctorId', 'name nameAr specialty color')
      .lean();
    if (!patient) throw new NotFoundException('Patient not found');
    const [appointments, invoices, toothProcedures, alerts] = await Promise.all([
      this.appointmentModel.find({ patientId }).populate('doctorId', 'name nameAr color').sort({ date: -1, startTime: -1 }).lean(),
      this.invoiceModel.find({ patientId }).populate('doctorId', 'name nameAr').sort({ createdAt: -1 }).lean(),
      this.toothProcedureModel.find({ patientId }).populate('doctorId', 'name nameAr').sort({ date: -1 }).lean(),
      this.medicalAlertModel.find({ patientId }).lean(),
    ]);
    const medicalAlerts = alerts.map((a: Record<string, unknown>) => ({
      id: a._id != null ? String(a._id) : undefined,
      type: a.type,
      description: a.description,
      severity: a.severity,
    }));
    const dentalTreatments: Record<number, unknown[]> = {};
    for (const tp of toothProcedures as Array<Record<string, unknown>>) {
      const toothNum = tp.toothNumber as number;
      if (!dentalTreatments[toothNum]) dentalTreatments[toothNum] = [];
      dentalTreatments[toothNum].push({
        id: tp._id != null ? String(tp._id) : undefined,
        procedureType: tp.procedureType ?? tp.type,
        date: tp.date,
        appointmentId: tp.appointmentId != null ? String(tp.appointmentId) : undefined,
        notes: tp.notes,
        cost: tp.price,
      });
    }
    return {
      ...patient,
      appointments,
      invoices,
      toothProcedures,
      medicalAlerts,
      dentalTreatments,
    };
  }

  async update(id: string, dto: UpdatePatientDto) {
    const patientId = toObjectIdOrThrow(id, 'id');
    const update: Record<string, unknown> = { ...dto };
    if (dto.assignedDoctorId !== undefined) {
      if (dto.assignedDoctorId) {
        const oid = toObjectIdOrUndefined(dto.assignedDoctorId);
        if (!oid) throw new BadRequestException('assignedDoctorId must be a valid MongoDB ObjectId (24 hex characters)');
        update.assignedDoctorId = oid;
      } else {
        update.assignedDoctorId = null;
      }
    }
    const patient = await this.patientModel.findByIdAndUpdate(patientId, { $set: update }, { new: true }).lean();
    if (!patient) throw new NotFoundException('Patient not found');
    return patient;
  }

  async remove(id: string) {
    const patientId = toObjectIdOrThrow(id, 'id');
    const patient = await this.patientModel.findById(patientId);
    if (!patient) throw new NotFoundException('Patient not found');
    const [appointmentsCount, invoicesCount] = await Promise.all([
      this.appointmentModel.countDocuments({ patientId }),
      this.invoiceModel.countDocuments({ patientId }),
    ]);
    if (appointmentsCount > 0 || invoicesCount > 0) {
      throw new ConflictException(
        'Cannot delete patient with existing appointments or invoices. Remove or reassign them first.',
      );
    }
    await Promise.all([
      this.toothProcedureModel.deleteMany({ patientId }),
      this.medicalAlertModel.deleteMany({ patientId }),
      this.patientNotesService.deleteByPatient(id),
      this.prescriptionsService.deleteByPatient(id),
    ]);
    await this.patientModel.findByIdAndDelete(patientId);
  }
}
