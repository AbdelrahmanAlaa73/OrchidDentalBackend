import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Appointment } from './schemas/appointment.schema';
import { Patient } from '../patients/schemas/patient.schema';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { AppointmentStatus } from '../../enums';
import { addMinutesToTime } from '../../common/utils/fdi.validator';
import { toObjectIdOrThrow, toObjectIdOrUndefined } from '../../common/utils/objectid';

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectModel(Appointment.name) private appointmentModel: Model<Appointment>,
    @InjectModel(Patient.name) private patientModel: Model<Patient>,
  ) {}

  async findAll(query: { date?: string; doctorId?: string; patientId?: string; status?: string }, doctorIdFilter?: string) {
    const filter: Record<string, unknown> = {};
    if (query.date) filter.date = query.date;
    const doctorId = toObjectIdOrUndefined(query.doctorId);
    if (doctorId) filter.doctorId = doctorId;
    const patientId = toObjectIdOrUndefined(query.patientId);
    if (patientId) filter.patientId = patientId;
    if (query.status) filter.status = query.status;
    if (doctorIdFilter) filter.doctorId = toObjectIdOrThrow(doctorIdFilter, 'doctorId');
    return this.appointmentModel
      .find(filter)
      .populate('patientId', 'name nameAr phone')
      .populate('doctorId', 'name nameAr color')
      .sort({ date: 1, startTime: 1 })
      .lean();
  }

  async create(dto: CreateAppointmentDto) {
    const patientId = toObjectIdOrThrow(dto.patientId, 'patientId');
    const doctorId = toObjectIdOrThrow(dto.doctorId, 'doctorId');
    const endTime = addMinutesToTime(dto.startTime, dto.duration || 30);
    const conflicting = await this.appointmentModel.findOne({
      doctorId,
      date: dto.date,
      status: { $ne: AppointmentStatus.Cancelled },
      startTime: { $lt: endTime },
      endTime: { $gt: dto.startTime },
    });
    if (conflicting) {
      throw new ConflictException('Another appointment exists at this time for this doctor.');
    }
    const appointment = await this.appointmentModel.create({
      ...dto,
      patientId,
      doctorId,
      endTime,
      status: AppointmentStatus.Scheduled,
    });
    await this.patientModel.findByIdAndUpdate(patientId, { lastVisit: dto.date });
    return this.appointmentModel.findById(appointment._id).populate('patientId', 'name nameAr phone').populate('doctorId', 'name nameAr color').lean();
  }

  async update(id: string, dto: UpdateAppointmentDto, doctorIdFilter?: string) {
    const appointmentId = toObjectIdOrThrow(id, 'id');
    const appointment = await this.appointmentModel.findById(appointmentId);
    if (!appointment) throw new NotFoundException('Appointment not found');
    if (doctorIdFilter && !appointment.doctorId.equals(toObjectIdOrThrow(doctorIdFilter, 'doctorId'))) {
      throw new ForbiddenException('Not your appointment');
    }
    const date = dto.date ?? appointment.date;
    const startTime = dto.startTime ?? appointment.startTime;
    const duration = dto.duration ?? appointment.duration;
    const endTime = addMinutesToTime(startTime, duration);
    const doctorId = dto.doctorId != null
      ? toObjectIdOrThrow(dto.doctorId, 'doctorId')
      : appointment.doctorId;
    const conflicting = await this.appointmentModel.findOne({
      _id: { $ne: appointmentId },
      doctorId,
      date,
      status: { $ne: AppointmentStatus.Cancelled },
      startTime: { $lt: endTime },
      endTime: { $gt: startTime },
    });
    if (conflicting) {
      throw new ConflictException('Another appointment exists at this time for this doctor.');
    }
    appointment.date = date;
    appointment.startTime = startTime;
    appointment.duration = duration;
    appointment.endTime = endTime;
    if (dto.patientId != null) appointment.patientId = toObjectIdOrThrow(dto.patientId, 'patientId');
    if (dto.doctorId != null) appointment.doctorId = toObjectIdOrThrow(dto.doctorId, 'doctorId');
    if (dto.billingMode != null) appointment.billingMode = dto.billingMode;
    if (dto.procedure != null) appointment.procedure = dto.procedure;
    if (dto.procedureAr != null) appointment.procedureAr = dto.procedureAr;
    if (dto.notes != null) appointment.notes = dto.notes;
    if (dto.sterilizationBuffer != null) appointment.sterilizationBuffer = dto.sterilizationBuffer;
    if (dto.toothNumber != null) appointment.toothNumber = dto.toothNumber;
    await appointment.save();
    return this.appointmentModel.findById(appointmentId).populate('patientId', 'name nameAr phone').populate('doctorId', 'name nameAr color').lean();
  }

  async cancel(id: string, doctorIdFilter?: string) {
    const appointmentId = toObjectIdOrThrow(id, 'id');
    const appointment = await this.appointmentModel.findById(appointmentId);
    if (!appointment) throw new NotFoundException('Appointment not found');
    if (doctorIdFilter && !appointment.doctorId.equals(toObjectIdOrThrow(doctorIdFilter, 'doctorId'))) {
      throw new ForbiddenException('Not your appointment');
    }
    appointment.status = AppointmentStatus.Cancelled;
    await appointment.save();
    return appointment.toObject();
  }

  async remove(id: string, doctorIdFilter?: string) {
    const appointmentId = toObjectIdOrThrow(id, 'id');
    const appointment = await this.appointmentModel.findById(appointmentId);
    if (!appointment) throw new NotFoundException('Appointment not found');
    if (doctorIdFilter && !appointment.doctorId.equals(toObjectIdOrThrow(doctorIdFilter, 'doctorId'))) {
      throw new ForbiddenException('Not your appointment');
    }
    await this.appointmentModel.findByIdAndDelete(appointmentId);
    return { deleted: true, id };
  }
}
