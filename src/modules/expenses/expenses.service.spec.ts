import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test } from '@nestjs/testing';
import { Types } from 'mongoose';
import { ExpensesService } from './expenses.service';
import { Expense } from './schemas/expense.schema';

describe('ExpensesService', () => {
  let service: ExpensesService;
  let expenseModel: any;

  beforeEach(async () => {
    expenseModel = {
      find: jest.fn(),
      create: jest.fn(),
      findById: jest.fn(),
      findByIdAndUpdate: jest.fn(),
      findByIdAndDelete: jest.fn(),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        ExpensesService,
        { provide: getModelToken(Expense.name), useValue: expenseModel },
      ],
    }).compile();

    service = moduleRef.get(ExpensesService);
  });

  it('create stores amount and defaults currency to EGP', async () => {
    const id = new Types.ObjectId();
    expenseModel.create.mockResolvedValue({ _id: id });
    expenseModel.findById.mockReturnValue({
      populate: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue({ _id: id, amount: 150, currency: 'EGP' }),
      }),
    });

    const result = await service.create(
      { category: 'materials' as any, categoryAr: 'مواد', amount: 150, date: '2026-03-21' },
      new Types.ObjectId().toString(),
    );

    expect(expenseModel.create).toHaveBeenCalledWith(expect.objectContaining({ amount: 150, currency: 'EGP' }));
    expect(result!.amount).toBe(150);
  });

  it('update changes amount for owner/admin', async () => {
    const id = new Types.ObjectId();
    expenseModel.findById.mockResolvedValue({ _id: id, createdBy: new Types.ObjectId() });
    expenseModel.findByIdAndUpdate.mockResolvedValue({});
    expenseModel.findById.mockReturnValueOnce({ _id: id, createdBy: new Types.ObjectId() }).mockReturnValueOnce({
      populate: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue({ _id: id, amount: 200 }),
      }),
    });

    const result = await service.update(
      id.toString(),
      { amount: 200 },
      new Types.ObjectId().toString(),
      true,
    );

    expect(expenseModel.findByIdAndUpdate).toHaveBeenCalled();
    expect(result!.amount).toBe(200);
  });

  it('update throws NotFoundException when expense missing', async () => {
    expenseModel.findById.mockResolvedValue(null);
    await expect(
      service.update(new Types.ObjectId().toString(), { amount: 50 }, new Types.ObjectId().toString(), true),
    ).rejects.toThrow(NotFoundException);
  });

  it('remove throws ForbiddenException when non-owner edits another expense', async () => {
    expenseModel.findById.mockResolvedValue({
      createdBy: { equals: () => false },
    });
    await expect(
      service.remove(new Types.ObjectId().toString(), new Types.ObjectId().toString(), false),
    ).rejects.toThrow(ForbiddenException);
  });
});
