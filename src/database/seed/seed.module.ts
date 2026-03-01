import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ClinicSettings, ClinicSettingsSchema } from '../../modules/settings/schemas/clinic-settings.schema';
import { ProcedurePricing, ProcedurePricingSchema } from '../../modules/procedure-pricing/schemas/procedure-pricing.schema';
import { SeedService } from './seed.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ClinicSettings.name, schema: ClinicSettingsSchema },
      { name: ProcedurePricing.name, schema: ProcedurePricingSchema },
    ]),
  ],
  providers: [SeedService],
  exports: [SeedService],
})
export class SeedModule {}
