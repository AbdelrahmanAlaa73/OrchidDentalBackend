import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ToothProcedure } from './schemas/tooth-procedure.schema';
import { CreateToothProcedureDto } from './dto/create-tooth-procedure.dto';

@Injectable()
export class ToothProceduresService {
  constructor(@InjectModel(ToothProcedure.name) private toothProcedureModel: Model<ToothProcedure>) {}

  async findByPatient(patientId: string) {
    const procedures = await this.toothProcedureModel
      .find({ patientId: new Types.ObjectId(patientId) })
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
    const procedure = await this.toothProcedureModel.create({
      ...dto,
      patientId: new Types.ObjectId(patientId),
      doctorId: new Types.ObjectId(dto.doctorId),
      appointmentId: dto.appointmentId ? new Types.ObjectId(dto.appointmentId) : undefined,
      currency: dto.currency ?? 'EGP',
    });
    return this.toothProcedureModel.findById(procedure._id).populate('doctorId', 'name nameAr').lean();
  }

  async remove(id: string) {
    const deleted = await this.toothProcedureModel.findByIdAndDelete(id);
    if (!deleted) throw new NotFoundException('Tooth procedure not found');
  }
}
