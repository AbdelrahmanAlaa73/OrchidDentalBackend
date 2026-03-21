import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { getModelToken } from '@nestjs/mongoose';
import { Test } from '@nestjs/testing';
import { Types } from 'mongoose';
import { DiscountType, InvoiceStatus, PaymentMethod } from '../../enums';
import { Expense } from '../expenses/schemas/expense.schema';
import { InvoicePayment } from './schemas/invoice-payment.schema';
import { Invoice } from './schemas/invoice.schema';
import { InvoicesService } from './invoices.service';

describe('InvoicesService', () => {
  let service: InvoicesService;
  let invoiceModel: any;
  let paymentModel: any;
  let expenseModel: any;

  beforeEach(async () => {
    invoiceModel = {
      find: jest.fn(),
      findOne: jest.fn(),
      findById: jest.fn(),
      findByIdAndDelete: jest.fn(),
      countDocuments: jest.fn(),
      aggregate: jest.fn(),
      create: jest.fn(),
    };
    paymentModel = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      deleteMany: jest.fn(),
    };
    expenseModel = {
      find: jest.fn(),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        InvoicesService,
        { provide: getModelToken(Invoice.name), useValue: invoiceModel },
        { provide: getModelToken(InvoicePayment.name), useValue: paymentModel },
        { provide: getModelToken(Expense.name), useValue: expenseModel },
        { provide: ConfigService, useValue: { get: jest.fn() } },
      ],
    }).compile();

    service = moduleRef.get(InvoicesService);
  });

  it('is defined', () => {
    expect(service).toBeDefined();
  });

  const buildFindChain = (result: unknown[]) => {
    const chain: Record<string, jest.Mock> = {};
    chain.populate = jest.fn(() => chain);
    chain.sort = jest.fn(() => chain);
    chain.skip = jest.fn(() => chain);
    chain.limit = jest.fn(() => chain);
    chain.select = jest.fn(() => chain);
    chain.lean = jest.fn().mockResolvedValue(result);
    return chain;
  };

  it('findOne throws NotFoundException when invoice not found', async () => {
    invoiceModel.findOne.mockReturnValue({
      populate: jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(null),
        }),
      }),
    });

    await expect(service.findOne(new Types.ObjectId().toString())).rejects.toThrow(NotFoundException);
  });

  it('create computes totals and creates payment when paid > 0', async () => {
    const invoiceId = new Types.ObjectId();
    invoiceModel.create.mockResolvedValue({
      _id: invoiceId,
      patientId: new Types.ObjectId(),
      doctorId: new Types.ObjectId(),
      currency: 'EGP',
    });
    paymentModel.create.mockResolvedValue({});
    invoiceModel.findById.mockReturnValue({
      populate: jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue({ _id: invoiceId }),
        }),
      }),
    });

    await service.create({
      patientId: new Types.ObjectId().toString(),
      doctorId: new Types.ObjectId().toString(),
      items: [{ procedure: 'Exam', procedureAr: 'فحص', unitPrice: 100 }],
      discount: 10,
      discountType: DiscountType.Fixed,
      paid: 30,
      paymentMethod: 'transfer',
    });

    expect(invoiceModel.create).toHaveBeenCalledWith(
      expect.objectContaining({
        subtotal: 100,
        total: 90,
        remaining: 60,
        status: InvoiceStatus.Partial,
      }),
    );
    expect(paymentModel.create).toHaveBeenCalledWith(
      expect.objectContaining({ method: PaymentMethod.Instapay, amount: 30 }),
    );
  });

  it('create handles multi-item subtotal, percentage discount, and paid total', async () => {
    const invoiceId = new Types.ObjectId();
    invoiceModel.create.mockResolvedValue({
      _id: invoiceId,
      patientId: new Types.ObjectId(),
      doctorId: new Types.ObjectId(),
      currency: 'EGP',
    });
    invoiceModel.findById.mockReturnValue({
      populate: jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue({ _id: invoiceId }),
        }),
      }),
    });

    await service.create({
      patientId: new Types.ObjectId().toString(),
      doctorId: new Types.ObjectId().toString(),
      items: [
        { procedure: 'A', procedureAr: 'أ', quantity: 1, unitPrice: 100 },
        { procedure: 'B', procedureAr: 'ب', quantity: 1, unitPrice: 50 },
      ],
      discount: 25,
      discountType: DiscountType.Percentage,
      paid: 112.5,
      paymentMethod: 'cash',
    });

    expect(invoiceModel.create).toHaveBeenCalledWith(
      expect.objectContaining({
        subtotal: 150,
        total: 112.5,
        paid: 112.5,
        remaining: 0,
        status: InvoiceStatus.Paid,
      }),
    );
  });

  it('create does not create payment record when paid is zero', async () => {
    const invoiceId = new Types.ObjectId();
    invoiceModel.create.mockResolvedValue({
      _id: invoiceId,
      patientId: new Types.ObjectId(),
      doctorId: new Types.ObjectId(),
      currency: 'EGP',
    });
    invoiceModel.findById.mockReturnValue({
      populate: jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue({ _id: invoiceId }),
        }),
      }),
    });

    await service.create({
      patientId: new Types.ObjectId().toString(),
      doctorId: new Types.ObjectId().toString(),
      items: [{ procedure: 'Exam', procedureAr: 'فحص', unitPrice: 100 }],
      paid: 0,
      discount: 0,
      discountType: DiscountType.Fixed,
    });

    expect(invoiceModel.create).toHaveBeenCalledWith(
      expect.objectContaining({
        subtotal: 100,
        total: 100,
        remaining: 100,
        status: InvoiceStatus.Unpaid,
      }),
    );
    expect(paymentModel.create).not.toHaveBeenCalled();
  });

  it('update recalculates subtotal total remaining and status', async () => {
    const invoiceId = new Types.ObjectId();
    const mockInvoice = {
      doctorId: new Types.ObjectId(),
      items: [],
      subtotal: 0,
      discount: 10,
      discountType: DiscountType.Fixed,
      total: 0,
      paid: 30,
      remaining: 0,
      status: InvoiceStatus.Unpaid,
      save: jest.fn().mockResolvedValue(undefined),
    };
    invoiceModel.findById
      .mockResolvedValueOnce(mockInvoice)
      .mockReturnValueOnce({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue({ _id: invoiceId }),
          }),
        }),
      });

    await service.update(invoiceId.toString(), {
      items: [{ procedure: 'X', procedureAr: 'س', quantity: 2, unitPrice: 50 }],
    });

    expect(mockInvoice.subtotal).toBe(100);
    expect(mockInvoice.total).toBe(90);
    expect(mockInvoice.remaining).toBe(60);
    expect(mockInvoice.status).toBe(InvoiceStatus.Partial);
  });

  it('addPayment updates invoice to paid when amount equals remaining', async () => {
    const invoiceId = new Types.ObjectId();
    const mockInvoice = {
      _id: invoiceId,
      patientId: new Types.ObjectId(),
      doctorId: new Types.ObjectId(),
      currency: 'EGP',
      remaining: 100,
      paid: 0,
      total: 100,
      status: InvoiceStatus.Unpaid,
      save: jest.fn().mockResolvedValue(undefined),
    };
    invoiceModel.findById.mockResolvedValue(mockInvoice);
    paymentModel.create.mockResolvedValue({});
    paymentModel.findOne.mockReturnValue({
      sort: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue({ amount: 100 }),
      }),
    });

    const result = await service.addPayment(invoiceId.toString(), 100, 'cash');

    expect(mockInvoice.remaining).toBe(0);
    expect(mockInvoice.status).toBe(InvoiceStatus.Paid);
    expect(result).toEqual({ amount: 100 });
  });

  it('addPayment throws when amount exceeds remaining balance', async () => {
    invoiceModel.findById.mockResolvedValue({
      doctorId: new Types.ObjectId(),
      remaining: 10,
    });

    await expect(
      service.addPayment(new Types.ObjectId().toString(), 20, 'cash'),
    ).rejects.toThrow(ForbiddenException);
  });

  it('findAll returns aggregate totals and afterExpenses', async () => {
    const invId = new Types.ObjectId();
    const invoiceList = [{ _id: invId, total: 100 }];
    const listChain = buildFindChain(invoiceList);
    const idsChain = buildFindChain([{ _id: invId }]);
    invoiceModel.find
      .mockReturnValueOnce(listChain)
      .mockReturnValueOnce(idsChain);
    invoiceModel.countDocuments.mockResolvedValue(1);
    invoiceModel.aggregate.mockResolvedValue([
      {
        totalRevenue: 100,
        totalCollected: 80,
        pendingBalance: 20,
        totalDiscounts: 10,
        completedInvoicesCount: 0,
        pendingInvoicesCount: 1,
      },
    ]);
    expenseModel.find.mockReturnValue({
      lean: jest.fn().mockResolvedValue([{ amount: 30 }]),
    });
    paymentModel.find.mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([{ method: PaymentMethod.Cash, amount: 80 }]),
      }),
    });

    const result = await service.findAll({
      startDate: '2026-01-01',
      endDate: '2026-01-02',
      page: 1,
      limit: 20,
    });

    expect(result.totalRevenue).toBe(100);
    expect(result.totalCollected).toBe(80);
    expect(result.pendingBalance).toBe(20);
    expect(result.afterExpenses).toBe(50);
    expect(result.collectedByPaymentMethod).toEqual({ cash: 80, vodafoneCash: 0, instapay: 0 });
  });
});
