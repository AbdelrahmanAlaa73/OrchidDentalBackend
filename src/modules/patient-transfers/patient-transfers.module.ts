import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PatientTransfer, PatientTransferSchema } from './schemas/patient-transfer.schema';
import { Patient, PatientSchema } from '../patients/schemas/patient.schema';
import { PatientTransfersService } from './patient-transfers.service';
import { PatientTransfersController } from './patient-transfers.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PatientTransfer.name, schema: PatientTransferSchema },
      { name: Patient.name, schema: PatientSchema },
    ]),
  ],
  controllers: [PatientTransfersController],
  providers: [PatientTransfersService],
  exports: [PatientTransfersService, MongooseModule],
})
export class PatientTransfersModule {}
