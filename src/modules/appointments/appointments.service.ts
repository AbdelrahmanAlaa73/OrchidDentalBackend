import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Appointment } from './schemas/appointment.schema';
import { Patient } from '../patients/schemas/patient.schema';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { AppointmentStatus } from '../../enums';
import { addMinutesToTime } from '../../common/utils/fdi.validator';

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectModel(Appointment.name) private appointmentModel: Model<Appointment>,
    @InjectModel(Patient.name) private patientModel: Model<Patient>,
  ) {}

  async findAll(query: { date?: string; doctorId?: string; patientId?: string; status?: string }, doctorIdFilter?: string) {
    const filter: Record<string, unknown> = {};
    if (query.date) filter.date = query.date;
    if (query.doctorId) filter.doctorId = new Types.ObjectId(query.doctorId);
    if (query.patientId) filter.patientId = new Types.ObjectId(query.patientId);
    if (query.status) filter.status = query.status;
    if (doctorIdFilter) filter.doctorId = new Types.ObjectId(doctorIdFilter);
    return this.appointmentModel
      .find(filter)
      .populate('patientId', 'name nameAr phone')
      .populate('doctorId', 'name nameAr color')
      .sort({ date: 1, startTime: 1 })
      .lean();
  }

  async create(dto: CreateAppointmentDto) {
    const endTime = addMinutesToTime(dto.startTime, dto.duration || 30);
    const conflicting = await this.appointmentModel.findOne({
      doctorId: new Types.ObjectId(dto.doctorId),
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
      patientId: new Types.ObjectId(dto.patientId),
      doctorId: new Types.ObjectId(dto.doctorId),
      endTime,
      status: AppointmentStatus.Scheduled,
    });
    await this.patientModel.findByIdAndUpdate(dto.patientId, { lastVisit: dto.date });
    return this.appointmentModel.findById(appointment._id).populate('patientId', 'name nameAr phone').populate('doctorId', 'name nameAr color').lean();
  }

  async update(id: string, dto: UpdateAppointmentDto, doctorIdFilter?: string) {
    const appointment = await this.appointmentModel.findById(id);
    if (!appointment) throw new NotFoundException('Appointment not found');
    if (doctorIdFilter && !appointment.doctorId.equals(new Types.ObjectId(doctorIdFilter))) {
      throw new ForbiddenException('Not your appointment');
    }
    const date = dto.date ?? appointment.date;
    const startTime = dto.startTime ?? appointment.startTime;
    const duration = dto.duration ?? appointment.duration;
    const endTime = addMinutesToTime(startTime, duration);
    const doctorId = dto.doctorId != null
      ? new Types.ObjectId(dto.doctorId)
      : appointment.doctorId;
    const conflicting = await this.appointmentModel.findOne({
      _id: { $ne: new Types.ObjectId(id) },
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
    if (dto.patientId != null) appointment.patientId = new Types.ObjectId(dto.patientId);
    if (dto.doctorId != null) appointment.doctorId = new Types.ObjectId(dto.doctorId);
    if (dto.billingMode != null) appointment.billingMode = dto.billingMode;
    if (dto.procedure != null) appointment.procedure = dto.procedure;
    if (dto.procedureAr != null) appointment.procedureAr = dto.procedureAr;
    if (dto.notes != null) appointment.notes = dto.notes;
    if (dto.sterilizationBuffer != null) appointment.sterilizationBuffer = dto.sterilizationBuffer;
    if (dto.toothNumber != null) appointment.toothNumber = dto.toothNumber;
    await appointment.save();
    return this.appointmentModel.findById(id).populate('patientId', 'name nameAr phone').populate('doctorId', 'name nameAr color').lean();
  }

  async cancel(id: string, doctorIdFilter?: string) {
    const appointment = await this.appointmentModel.findById(id);
    if (!appointment) throw new NotFoundException('Appointment not found');
    if (doctorIdFilter && !appointment.doctorId.equals(new Types.ObjectId(doctorIdFilter))) {
      throw new ForbiddenException('Not your appointment');
    }
    appointment.status = AppointmentStatus.Cancelled;
    await appointment.save();
    return appointment.toObject();
  }

  async remove(id: string, doctorIdFilter?: string) {
    const appointment = await this.appointmentModel.findById(id);
    if (!appointment) throw new NotFoundException('Appointment not found');
    if (doctorIdFilter && !appointment.doctorId.equals(new Types.ObjectId(doctorIdFilter))) {
      throw new ForbiddenException('Not your appointment');
    }
    await this.appointmentModel.findByIdAndDelete(id);
    return { deleted: true, id };
  }
}
