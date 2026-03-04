import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { toObjectIdOrThrow, toObjectIdOrUndefined } from '../../common/utils/objectid';
import { ToothProcedure } from './schemas/tooth-procedure.schema';
import { CreateToothProcedureDto } from './dto/create-tooth-procedure.dto';

@Injectable()
export class ToothProceduresService {
  constructor(@InjectModel(ToothProcedure.name) private toothProcedureModel: Model<ToothProcedure>) {}

  async findByPatient(patientId: string) {
    const procedures = await this.toothProcedureModel
      .find({ patientId: toObjectIdOrThrow(patientId, 'patientId') })
      .populate('doctorId', 'name nameAr')
      .sort({ date: -1 })
      .lean();
    const byTooth: Record<number, typeof procedures> = {};
    for (const p of procedures) {
      if (!byTooth[p.toothNumber]) byTooth[p.toothNumber] = [];
      byTooth[p.toothNumber].push(p);
    }
    return { procedures, byTooth };
  }

  async create(patientId: string, dto: CreateToothProcedureDto) {
    const appointmentId = dto.appointmentId ? toObjectIdOrUndefined(dto.appointmentId) : undefined;
    if (dto.appointmentId && !appointmentId) {
      throw new BadRequestException('appointmentId must be a valid MongoDB ObjectId (24 hex characters)');
    }
    const procedure = await this.toothProcedureModel.create({
      ...dto,
      patientId: toObjectIdOrThrow(patientId, 'patientId'),
      doctorId: toObjectIdOrThrow(dto.doctorId, 'doctorId'),
      appointmentId,
      currency: dto.currency ?? 'EGP',
    });
    return this.toothProcedureModel.findById(procedure._id).populate('doctorId', 'name nameAr').lean();
  }

  async remove(id: string) {
    const deleted = await this.toothProcedureModel.findByIdAndDelete(toObjectIdOrThrow(id, 'id'));
    if (!deleted) throw new NotFoundException('Tooth procedure not found');
  }
}
