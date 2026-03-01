import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DailyCloseout, DailyCloseoutSchema } from './schemas/daily-closeout.schema';
import { Invoice, InvoiceSchema } from '../invoices/schemas/invoice.schema';
import { InvoicePayment, InvoicePaymentSchema } from '../invoices/schemas/invoice-payment.schema';
import { Expense, ExpenseSchema } from '../expenses/schemas/expense.schema';
import { DailyCloseoutsService } from './daily-closeouts.service';
import { DailyCloseoutsController } from './daily-closeouts.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: DailyCloseout.name, schema: DailyCloseoutSchema },
      { name: Invoice.name, schema: InvoiceSchema },
      { name: InvoicePayment.name, schema: InvoicePaymentSchema },
      { name: Expense.name, schema: ExpenseSchema },
    ]),
  ],
  controllers: [DailyCloseoutsController],
  providers: [DailyCloseoutsService],
  exports: [DailyCloseoutsService, MongooseModule],
})
export class DailyCloseoutsModule {}
