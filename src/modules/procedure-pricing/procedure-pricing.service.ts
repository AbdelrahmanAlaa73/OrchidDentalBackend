import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ProcedurePricing } from './schemas/procedure-pricing.schema';
import { CreateProcedurePricingDto } from './dto/create-procedure-pricing.dto';
import { UpdateProcedurePricingDto } from './dto/update-procedure-pricing.dto';

type ProcedurePricingItem = {
  procedure: string;
  procedureAr: string;
  basePrice: number;
  procedureType?: string;
};

@Injectable()
export class ProcedurePricingService {
  constructor(@InjectModel(ProcedurePricing.name) private procedurePricingModel: Model<ProcedurePricing>) {}

  async findAll() {
    return this.procedurePricingModel.find().sort({ procedure: 1 }).lean();
  }

  async findOne(id: string) {
    const doc = await this.procedurePricingModel.findById(id).lean();
    if (!doc) throw new NotFoundException('Procedure pricing not found');
    return doc;
  }

  async create(dto: CreateProcedurePricingDto) {
    const existing = await this.procedurePricingModel.findOne({ procedure: dto.procedure.trim() });
    if (existing) throw new ConflictException(`Procedure "${dto.procedure}" already exists`);
    const created = await this.procedurePricingModel.create(dto);
    return created.toObject();
  }

  async update(id: string, dto: UpdateProcedurePricingDto) {
    const doc = await this.procedurePricingModel.findById(id);
    if (!doc) throw new NotFoundException('Procedure pricing not found');
    if (dto.procedure !== undefined) {
      const duplicate = await this.procedurePricingModel.findOne({
        procedure: dto.procedure.trim(),
        _id: { $ne: new Types.ObjectId(id) },
      });
      if (duplicate) throw new ConflictException(`Procedure "${dto.procedure}" already exists`);
    }
    Object.assign(doc, dto);
    await doc.save();
    return doc.toObject();
  }

  async remove(id: string) {
    const result = await this.procedurePricingModel.findByIdAndDelete(id);
    if (!result) throw new NotFoundException('Procedure pricing not found');
  }

  async bulkUpdate(items: ProcedurePricingItem[]) {
    await this.procedurePricingModel.deleteMany({});
    const inserted = await this.procedurePricingModel.insertMany(items);
    return inserted;
  }
}
