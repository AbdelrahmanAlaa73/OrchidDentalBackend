import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ProcedurePricing } from './schemas/procedure-pricing.schema';

@Injectable()
export class ProcedurePricingService {
  constructor(@InjectModel(ProcedurePricing.name) private procedurePricingModel: Model<ProcedurePricing>) {}

  async findAll() {
    return this.procedurePricingModel.find().sort({ procedure: 1 }).lean();
  }

  async bulkUpdate(items: Array<{ procedure: string; procedureAr: string; basePrice: number; doctorPercent: number; clinicPercent: number; maxDiscount?: number }>) {
    await this.procedurePricingModel.deleteMany({});
    const inserted = await this.procedurePricingModel.insertMany(
      items.map((p) => ({ ...p, maxDiscount: p.maxDiscount ?? 0 })),
    );
    return inserted;
  }
}
