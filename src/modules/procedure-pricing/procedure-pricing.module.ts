import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProcedurePricing, ProcedurePricingSchema } from './schemas/procedure-pricing.schema';
import { ProcedurePricingService } from './procedure-pricing.service';
import { ProcedurePricingController } from './procedure-pricing.controller';

@Module({
  imports: [MongooseModule.forFeature([{ name: ProcedurePricing.name, schema: ProcedurePricingSchema }])],
  controllers: [ProcedurePricingController],
  providers: [ProcedurePricingService],
  exports: [ProcedurePricingService, MongooseModule],
})
export class ProcedurePricingModule {}
