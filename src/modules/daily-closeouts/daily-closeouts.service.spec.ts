import { ConflictException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { getModelToken } from '@nestjs/mongoose';
import { Test } from '@nestjs/testing';
import { Types } from 'mongoose';
import { UserRole } from '../../enums';
import { Expense } from '../expenses/schemas/expense.schema';
import { InvoicePayment } from '../invoices/schemas/invoice-payment.schema';
import { Invoice } from '../invoices/schemas/invoice.schema';
import { DailyCloseoutsService } from './daily-closeouts.service';
import { DailyCloseout } from './schemas/daily-closeout.schema';

describe('DailyCloseoutsService', () => {
  let service: DailyCloseoutsService;
  let closeoutModel: any;
  let invoiceModel: any;
  let invoicePaymentModel: any;
  let expenseModel: any;

  beforeEach(async () => {
    closeoutModel = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      findById: jest.fn(),
      findByIdAndDelete: jest.fn(),
    };
    invoiceModel = {
      find: jest.fn(),
    };
    invoicePaymentModel = {
      find: jest.fn(),
    };
    expenseModel = {
      find: jest.fn(),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        DailyCloseoutsService,
        { provide: getModelToken(DailyCloseout.name), useValue: closeoutModel },
        { provide: getModelToken(Invoice.name), useValue: invoiceModel },
        { provide: getModelToken(InvoicePayment.name), useValue: invoicePaymentModel },
        { provide: getModelToken(Expense.name), useValue: expenseModel },
        { provide: ConfigService, useValue: { get: jest.fn() } },
      ],
    }).compile();

    service = moduleRef.get(DailyCloseoutsService);
  });

  it('is defined', () => {
    expect(service).toBeDefined();
  });

  it('getByDate throws when closeout not found', async () => {
    closeoutModel.findOne.mockReturnValue({
      populate: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(null),
      }),
    });
    await expect(service.getByDate('2026-03-20')).rejects.toThrow(NotFoundException);
  });

  it('create throws when closeout already exists', async () => {
    closeoutModel.findOne.mockResolvedValue({ _id: new Types.ObjectId() });

    await expect(
      service.create('2026-03-20', new Types.ObjectId().toString(), {
        role: UserRole.Admin,
        userId: new Types.ObjectId().toString(),
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('getPreview returns aggregates', async () => {
    invoicePaymentModel.find.mockReturnValue({
      lean: jest.fn().mockResolvedValue([
        { method: 'cash', amount: 100, invoiceId: new Types.ObjectId() },
        { method: 'instapay', amount: 50, invoiceId: new Types.ObjectId() },
      ]),
    });
    invoiceModel.find.mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([]),
      }),
    });
    expenseModel.find.mockReturnValue({
      lean: jest.fn().mockResolvedValue([{ amount: 30 }]),
    });

    const result = await service.getPreview('2026-03-20');
    expect(result.totalCollected).toBe(150);
    expect(result.totalExpenses).toBe(30);
    expect(result.finalBalance).toBe(120);
  });

  it('getPreview computes all payment method buckets, revenue, and dummy payments', async () => {
    const paidInvoiceId = new Types.ObjectId();
    const unpaidInvoiceId = new Types.ObjectId();
    invoicePaymentModel.find.mockReturnValue({
      lean: jest.fn().mockResolvedValue([
        { method: 'cash', amount: 100, invoiceId: paidInvoiceId },
        { method: 'card', amount: 50, invoiceId: paidInvoiceId },
        { method: 'vodafone_cash', amount: 25, invoiceId: paidInvoiceId },
        { method: 'instapay', amount: 75, invoiceId: paidInvoiceId },
      ]),
    });
    invoiceModel.find.mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([
          { _id: paidInvoiceId, total: 150 },
          { _id: unpaidInvoiceId, total: 200 },
        ]),
      }),
    });
    expenseModel.find.mockReturnValue({
      lean: jest.fn().mockResolvedValue([{ amount: 40 }, { amount: 10 }]),
    });

    const result = await service.getPreview('2026-03-20');

    expect(result.totalCollected).toBe(250);
    expect(result.totalExpenses).toBe(50);
    expect(result.finalBalance).toBe(200);
    expect(result.revenue).toBe(350);
    expect((result.payments as Array<{ isDummy?: boolean }>).some((p) => p.isDummy)).toBe(true);
  });

  it('getPreview handles empty payments', async () => {
    invoicePaymentModel.find.mockReturnValue({
      lean: jest.fn().mockResolvedValue([]),
    });
    invoiceModel.find.mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([]),
      }),
    });
    expenseModel.find.mockReturnValue({
      lean: jest.fn().mockResolvedValue([{ amount: 20 }]),
    });

    const result = await service.getPreview('2026-03-20');
    expect(result.totalCollected).toBe(0);
    expect(result.finalBalance).toBe(-20);
  });

  it('create computes totals from payments and expenses', async () => {
    closeoutModel.findOne.mockResolvedValue(null);
    invoicePaymentModel.find.mockResolvedValue([
      { method: 'cash', amount: 100 },
      { method: 'instapay', amount: 50 },
    ]);
    expenseModel.find.mockResolvedValue([
      { _id: new Types.ObjectId(), category: 'materials', categoryAr: 'مواد', description: 'x', amount: 30 },
    ]);
    const closeoutId = new Types.ObjectId();
    closeoutModel.create.mockResolvedValue({ _id: closeoutId });
    closeoutModel.findById.mockReturnValue({
      populate: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue({ _id: closeoutId }),
      }),
    });

    await service.create('2026-03-20', new Types.ObjectId().toString(), {
      role: UserRole.Admin,
      userId: new Types.ObjectId().toString(),
    });

    expect(closeoutModel.create).toHaveBeenCalledWith(
      expect.objectContaining({
        cashCollected: 100,
        transferCollected: 50,
        totalCollected: 150,
        totalExpenses: 30,
        finalBalance: 120,
      }),
    );
  });
});
