import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Invoice, InvoiceSchema } from './schemas/invoice.schema';
import { InvoicePayment, InvoicePaymentSchema } from './schemas/invoice-payment.schema';
import { Expense, ExpenseSchema } from '../expenses/schemas/expense.schema';
import { InvoicesService } from './invoices.service';
import { InvoicesController } from './invoices.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Invoice.name, schema: InvoiceSchema },
      { name: InvoicePayment.name, schema: InvoicePaymentSchema },
      { name: Expense.name, schema: ExpenseSchema },
    ]),
  ],
  controllers: [InvoicesController],
  providers: [InvoicesService],
  exports: [InvoicesService, MongooseModule],
})
export class InvoicesModule {}
