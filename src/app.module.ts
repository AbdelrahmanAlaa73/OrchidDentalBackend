import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { configuration } from './config/configuration';
import { AuthModule } from './modules/auth/auth.module';
import { DoctorsModule } from './modules/doctors/doctors.module';
import { PatientsModule } from './modules/patients/patients.module';
import { AppointmentsModule } from './modules/appointments/appointments.module';
import { InvoicesModule } from './modules/invoices/invoices.module';
import { ExpensesModule } from './modules/expenses/expenses.module';
import { DailyCloseoutsModule } from './modules/daily-closeouts/daily-closeouts.module';
import { WaitingListModule } from './modules/waiting-list/waiting-list.module';
import { ToothProceduresModule } from './modules/tooth-procedures/tooth-procedures.module';
import { MedicalAlertsModule } from './modules/medical-alerts/medical-alerts.module';
import { PatientTransfersModule } from './modules/patient-transfers/patient-transfers.module';
import { SettingsModule } from './modules/settings/settings.module';
import { ProcedurePricingModule } from './modules/procedure-pricing/procedure-pricing.module';
import { ReportsModule } from './modules/reports/reports.module';
import { SeedModule } from './database/seed/seed.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: ['.env', '.env.example'],
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>('mongodbUri') || 'mongodb://localhost:27017/orchid-dental',
        retryWrites: true,
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    DoctorsModule,
    PatientsModule,
    AppointmentsModule,
    InvoicesModule,
    ExpensesModule,
    DailyCloseoutsModule,
    WaitingListModule,
    ToothProceduresModule,
    MedicalAlertsModule,
    PatientTransfersModule,
    SettingsModule,
    ProcedurePricingModule,
    ReportsModule,
    SeedModule,
  ],
})
export class AppModule {}
