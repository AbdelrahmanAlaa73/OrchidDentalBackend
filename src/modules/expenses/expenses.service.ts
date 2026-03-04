import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { toObjectIdOrThrow, toObjectIdOrUndefined } from '../../common/utils/objectid';
import { Expense } from './schemas/expense.schema';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';

@Injectable()
export class ExpensesService {
  constructor(@InjectModel(Expense.name) private expenseModel: Model<Expense>) {}

  async findAll(query: { date?: string; createdBy?: string; category?: string }, userId?: string) {
    const filter: Record<string, unknown> = {};
    if (query.date) filter.date = query.date;
    const createdBy = userId ? toObjectIdOrThrow(userId, 'userId') : toObjectIdOrUndefined(query.createdBy);
    if (createdBy) filter.createdBy = createdBy;
    if (query.category) filter.category = query.category;
    return this.expenseModel.find(filter).populate('createdBy', 'name email').sort({ date: -1 }).lean();
  }

  async create(dto: CreateExpenseDto, userId: string) {
    const expense = await this.expenseModel.create({
      ...dto,
      createdBy: toObjectIdOrThrow(userId, 'userId'),
      currency: dto.currency ?? 'EGP',
    });
    return this.expenseModel.findById(expense._id).populate('createdBy', 'name email').lean();
  }

  async update(id: string, dto: UpdateExpenseDto, userId: string, isOwnerOrAdmin: boolean) {
    const expenseId = toObjectIdOrThrow(id, 'id');
    const expense = await this.expenseModel.findById(expenseId);
    if (!expense) throw new NotFoundException('Expense not found');
    if (!isOwnerOrAdmin && !expense.createdBy.equals(toObjectIdOrThrow(userId, 'userId'))) {
      throw new ForbiddenException('Can only edit your own expenses');
    }
    await this.expenseModel.findByIdAndUpdate(expenseId, { $set: dto });
    return this.expenseModel.findById(expenseId).populate('createdBy', 'name email').lean();
  }

  async remove(id: string, userId: string, isOwnerOrAdmin: boolean) {
    const expenseId = toObjectIdOrThrow(id, 'id');
    const expense = await this.expenseModel.findById(expenseId);
    if (!expense) throw new NotFoundException('Expense not found');
    if (!isOwnerOrAdmin && !expense.createdBy.equals(toObjectIdOrThrow(userId, 'userId'))) {
      throw new ForbiddenException('Can only delete your own expenses');
    }
    await this.expenseModel.findByIdAndDelete(expenseId);
  }
}
