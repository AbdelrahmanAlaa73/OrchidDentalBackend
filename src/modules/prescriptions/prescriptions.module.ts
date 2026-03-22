import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Prescription, PrescriptionSchema } from './schemas/prescription.schema';
import { PrescriptionsService } from './prescriptions.service';
import { PrescriptionsController } from './prescriptions.controller';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Prescription.name, schema: PrescriptionSchema }]),
  ],
  controllers: [PrescriptionsController],
  providers: [PrescriptionsService],
  exports: [PrescriptionsService, MongooseModule],
})
export class PrescriptionsModule {}
