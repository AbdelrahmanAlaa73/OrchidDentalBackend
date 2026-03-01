import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Patient } from './schemas/patient.schema';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { Appointment } from '../appointments/schemas/appointment.schema';
import { Invoice } from '../invoices/schemas/invoice.schema';
import { ToothProcedure } from '../tooth-procedures/schemas/tooth-procedure.schema';
import { MedicalAlert } from '../medical-alerts/schemas/medical-alert.schema';

@Injectable()
export class PatientsService {
  constructor(
    @InjectModel(Patient.name) private patientModel: Model<Patient>,
    @InjectModel(Appointment.name) private appointmentModel: Model<Appointment>,
    @InjectModel(Invoice.name) private invoiceModel: Model<Invoice>,
    @InjectModel(ToothProcedure.name) private toothProcedureModel: Model<ToothProcedure>,
    @InjectModel(MedicalAlert.name) private medicalAlertModel: Model<MedicalAlert>,
  ) {}

  async findAll(query: { search?: string; assignedDoctorId?: string; page?: number; limit?: number }) {
    const filter: Record<string, unknown> = {};
    if (query.assignedDoctorId) filter.assignedDoctorId = new Types.ObjectId(query.assignedDoctorId);
    if (query.search?.trim()) filter.$text = { $search: query.search.trim() };
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 20));
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.patientModel.find(filter).skip(skip).limit(limit).sort({ createdAt: -1 }).populate('assignedDoctorId', 'name nameAr specialty color').lean(),
      this.patientModel.countDocuments(filter),
    ]);
    return { items, total, page, limit };
  }

  async create(dto: CreatePatientDto) {
    const patient = await this.patientModel.create({
      ...dto,
      assignedDoctorId: dto.assignedDoctorId ? new Types.ObjectId(dto.assignedDoctorId) : undefined,
    });
    return patient.toObject();
  }

  async findOne(id: string): Promise<Record<string, unknown>> {
    const patient = await this.patientModel
      .findById(id)
      .populate('assignedDoctorId', 'name nameAr specialty color')
      .lean();
    if (!patient) throw new NotFoundException('Patient not found');
    const [appointments, invoices, toothProcedures, alerts] = await Promise.all([
      this.appointmentModel.find({ patientId: id }).populate('doctorId', 'name nameAr color').sort({ date: -1, startTime: -1 }).lean(),
      this.invoiceModel.find({ patientId: id }).populate('doctorId', 'name nameAr').sort({ createdAt: -1 }).lean(),
      this.toothProcedureModel.find({ patientId: id }).populate('doctorId', 'name nameAr').sort({ date: -1 }).lean(),
      this.medicalAlertModel.find({ patientId: id }).lean(),
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
        type: tp.type,
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
    const update: Record<string, unknown> = { ...dto };
    if (dto.assignedDoctorId !== undefined) update.assignedDoctorId = dto.assignedDoctorId ? new Types.ObjectId(dto.assignedDoctorId) : null;
    const patient = await this.patientModel.findByIdAndUpdate(id, { $set: update }, { new: true }).lean();
    if (!patient) throw new NotFoundException('Patient not found');
    return patient;
  }
}
