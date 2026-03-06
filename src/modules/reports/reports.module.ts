import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { InvoicePayment, InvoicePaymentSchema } from '../invoices/schemas/invoice-payment.schema';
import { Expense, ExpenseSchema } from '../expenses/schemas/expense.schema';
import { Invoice, InvoiceSchema } from '../invoices/schemas/invoice.schema';
import { ProcedurePricing, ProcedurePricingSchema } from '../procedure-pricing/schemas/procedure-pricing.schema';
import { Appointment, AppointmentSchema } from '../appointments/schemas/appointment.schema';
import { Doctor, DoctorSchema } from '../doctors/schemas/doctor.schema';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: InvoicePayment.name, schema: InvoicePaymentSchema },
      { name: Expense.name, schema: ExpenseSchema },
      { name: Invoice.name, schema: InvoiceSchema },
      { name: ProcedurePricing.name, schema: ProcedurePricingSchema },
      { name: Appointment.name, schema: AppointmentSchema },
      { name: Doctor.name, schema: DoctorSchema },
    ]),
  ],
  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}
