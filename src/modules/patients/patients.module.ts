import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Patient, PatientSchema } from './schemas/patient.schema';
import { PatientsService } from './patients.service';
import { PatientsController } from './patients.controller';
import { Appointment, AppointmentSchema } from '../appointments/schemas/appointment.schema';
import { Invoice, InvoiceSchema } from '../invoices/schemas/invoice.schema';
import { ToothProcedure, ToothProcedureSchema } from '../tooth-procedures/schemas/tooth-procedure.schema';
import { MedicalAlert, MedicalAlertSchema } from '../medical-alerts/schemas/medical-alert.schema';
import { ToothProceduresModule } from '../tooth-procedures/tooth-procedures.module';
import { MedicalAlertsModule } from '../medical-alerts/medical-alerts.module';
import { PatientNotesModule } from '../patient-notes/patient-notes.module';
import { PrescriptionsModule } from '../prescriptions/prescriptions.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Patient.name, schema: PatientSchema },
      { name: Appointment.name, schema: AppointmentSchema },
      { name: Invoice.name, schema: InvoiceSchema },
      { name: ToothProcedure.name, schema: ToothProcedureSchema },
      { name: MedicalAlert.name, schema: MedicalAlertSchema },
    ]),
    ToothProceduresModule,
    MedicalAlertsModule,
    PatientNotesModule,
    PrescriptionsModule,
  ],
  controllers: [PatientsController],
  providers: [PatientsService],
  exports: [PatientsService, MongooseModule],
})
export class PatientsModule {}
