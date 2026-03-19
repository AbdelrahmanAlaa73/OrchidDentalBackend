import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Prescription, PrescriptionSchema } from './schemas/prescription.schema';
import { PrescriptionsService } from './prescriptions.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Prescription.name, schema: PrescriptionSchema }]),
  ],
  providers: [PrescriptionsService],
  exports: [PrescriptionsService, MongooseModule],
})
export class PrescriptionsModule {}
