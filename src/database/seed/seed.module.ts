import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ClinicSettings, ClinicSettingsSchema } from '../../modules/settings/schemas/clinic-settings.schema';
import { ProcedurePricing, ProcedurePricingSchema } from '../../modules/procedure-pricing/schemas/procedure-pricing.schema';
import { Doctor, DoctorSchema } from '../../modules/doctors/schemas/doctor.schema';
import { SeedService } from './seed.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ClinicSettings.name, schema: ClinicSettingsSchema },
      { name: ProcedurePricing.name, schema: ProcedurePricingSchema },
      { name: Doctor.name, schema: DoctorSchema },
    ]),
  ],
  providers: [SeedService],
  exports: [SeedService],
})
export class SeedModule {}
