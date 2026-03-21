import { ConfigService } from '@nestjs/config';
import { getModelToken } from '@nestjs/mongoose';
import { Test } from '@nestjs/testing';
import { Types } from 'mongoose';
import { PaymentMethod } from '../../enums';
import { Appointment } from '../appointments/schemas/appointment.schema';
import { Doctor } from '../doctors/schemas/doctor.schema';
import { Expense } from '../expenses/schemas/expense.schema';
import { InvoicePayment } from '../invoices/schemas/invoice-payment.schema';
import { Invoice } from '../invoices/schemas/invoice.schema';
import { ProcedurePricing } from '../procedure-pricing/schemas/procedure-pricing.schema';
import { ReportsService } from './reports.service';

describe('ReportsService', () => {
  let service: ReportsService;
  let invoicePaymentModel: any;
  let expenseModel: any;
  let invoiceModel: any;
  let appointmentModel: any;
  let doctorModel: any;

  beforeEach(async () => {
    invoicePaymentModel = { find: jest.fn() };
    expenseModel = { find: jest.fn() };
    invoiceModel = { find: jest.fn() };
    appointmentModel = { aggregate: jest.fn() };
    doctorModel = { find: jest.fn() };

    const moduleRef = await Test.createTestingModule({
      providers: [
        ReportsService,
        { provide: getModelToken(InvoicePayment.name), useValue: invoicePaymentModel },
        { provide: getModelToken(Expense.name), useValue: expenseModel },
        { provide: getModelToken(Invoice.name), useValue: invoiceModel },
        { provide: getModelToken(ProcedurePricing.name), useValue: {} },
        { provide: getModelToken(Appointment.name), useValue: appointmentModel },
        { provide: getModelToken(Doctor.name), useValue: doctorModel },
        { provide: ConfigService, useValue: { get: jest.fn() } },
      ],
    }).compile();

    service = moduleRef.get(ReportsService);
  });

  it('computes revenue, collection, expenses, shares, and breakdowns', async () => {
    const doctorId = new Types.ObjectId();
    invoiceModel.find.mockReturnValue({
      lean: jest.fn().mockResolvedValue([
        {
          doctorId,
          total: 300,
          items: [
            { procedure: 'Exam', quantity: 1, total: 100 },
            { procedure: 'Cleaning', quantity: 2, total: 200 },
          ],
        },
      ]),
    });
    invoicePaymentModel.find.mockReturnValue({
      lean: jest.fn().mockResolvedValue([
        { amount: 120, method: PaymentMethod.Cash, paidDate: '2026-03-20' },
        { amount: 80, method: PaymentMethod.Card, paidDate: '2026-03-20' },
        { amount: 50, method: PaymentMethod.VodafoneCash, paidDate: '2026-03-21' },
        { amount: 30, method: PaymentMethod.Instapay, paidDate: '2026-03-21' },
      ]),
    });
    expenseModel.find.mockReturnValue({
      lean: jest.fn().mockResolvedValue([
        { amount: 60, category: 'materials', date: '2026-03-20' },
        { amount: 40, category: 'materials', date: '2026-03-21' },
      ]),
    });
    doctorModel.find.mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([
          { _id: doctorId, doctorSharePercent: 70, clinicSharePercent: 30 },
        ]),
      }),
    });
    appointmentModel.aggregate.mockResolvedValue([
      { _id: '2026-03-20', count: 2 },
      { _id: '2026-03-21', count: 1 },
    ]);

    const result = await service.getRevenueReport({
      startDate: '2026-03-20',
      endDate: '2026-03-21',
    });

    expect(result.totalRevenue).toBe(300);
    expect(result.totalCollected).toBe(280);
    expect(result.totalExpenses).toBe(100);
    expect(result.netRevenue).toBe(180);
    expect(result.collectedByPaymentMethod).toEqual({
      cash: 120,
      card: 80,
      vodafoneCash: 50,
      instapay: 30,
    });
    expect(result.doctorShare).toBe(210);
    expect(result.clinicShare).toBe(90);
    expect(result.procedureBreakdown).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ procedure: 'Exam', count: 1, totalAmount: 100 }),
        expect.objectContaining({ procedure: 'Cleaning', count: 2, totalAmount: 200 }),
      ]),
    );
    expect(result.expenseBreakdown).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ category: 'materials', count: 2, totalAmount: 100 }),
      ]),
    );
    expect(result.dailyBreakdown).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ date: '2026-03-20', revenue: 200, expenses: 60, appointmentCount: 2 }),
        expect.objectContaining({ date: '2026-03-21', revenue: 80, expenses: 40, appointmentCount: 1 }),
      ]),
    );
  });
});
