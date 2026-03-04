import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Expense } from './schemas/expense.schema';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';

@Injectable()
export class ExpensesService {
  constructor(@InjectModel(Expense.name) private expenseModel: Model<Expense>) {}

  async findAll(query: { date?: string; createdBy?: string; category?: string }, userId?: string) {
    const filter: Record<string, unknown> = {};
    if (query.date) filter.date = query.date;
    if (query.createdBy) filter.createdBy = new Types.ObjectId(query.createdBy);
    if (query.category) filter.category = query.category;
    if (userId) filter.createdBy = new Types.ObjectId(userId);
    return this.expenseModel.find(filter).populate('createdBy', 'name email').sort({ date: -1 }).lean();
  }

  async create(dto: CreateExpenseDto, userId: string) {
    const expense = await this.expenseModel.create({
      ...dto,
      createdBy: new Types.ObjectId(userId),
      currency: dto.currency ?? 'EGP',
    });
    return this.expenseModel.findById(expense._id).populate('createdBy', 'name email').lean();
  }

  async update(id: string, dto: UpdateExpenseDto, userId: string, isOwnerOrAdmin: boolean) {
    const expense = await this.expenseModel.findById(id);
    if (!expense) throw new NotFoundException('Expense not found');
    if (!isOwnerOrAdmin && !expense.createdBy.equals(new Types.ObjectId(userId))) {
      throw new ForbiddenException('Can only edit your own expenses');
    }
    await this.expenseModel.findByIdAndUpdate(id, { $set: dto });
    return this.expenseModel.findById(id).populate('createdBy', 'name email').lean();
  }

  async remove(id: string, userId: string, isOwnerOrAdmin: boolean) {
    const expense = await this.expenseModel.findById(id);
    if (!expense) throw new NotFoundException('Expense not found');
    if (!isOwnerOrAdmin && !expense.createdBy.equals(new Types.ObjectId(userId))) {
      throw new ForbiddenException('Can only delete your own expenses');
    }
    await this.expenseModel.findByIdAndDelete(id);
  }
}
