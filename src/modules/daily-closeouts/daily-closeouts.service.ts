import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { toObjectIdOrThrow } from '../../common/utils/objectid';
import { getWorkdayRange } from '../../common/utils/date-range.util';
import { DailyCloseout } from './schemas/daily-closeout.schema';
import { UpdateDailyCloseoutDto } from './dto/update-daily-closeout.dto';
import { Invoice } from '../invoices/schemas/invoice.schema';
import { InvoicePayment } from '../invoices/schemas/invoice-payment.schema';
import { Expense } from '../expenses/schemas/expense.schema';
import { PaymentMethod } from '../../enums';
import { UserRole } from '../../enums';

type RoleFilter = { role: UserRole; userId: string; doctorId?: string };

@Injectable()
export class DailyCloseoutsService {
  constructor(
    @InjectModel(DailyCloseout.name) private dailyCloseoutModel: Model<DailyCloseout>,
    @InjectModel(Invoice.name) private invoiceModel: Model<Invoice>,
    @InjectModel(InvoicePayment.name) private invoicePaymentModel: Model<InvoicePayment>,
    @InjectModel(Expense.name) private expenseModel: Model<Expense>,
    private configService: ConfigService,
  ) {}

  private getWorkdayBounds(date: string): { start: Date; end: Date } {
    const tz = this.configService.get<string>('clinicTimezone') ?? 'Africa/Cairo';
    const startHour = this.configService.get<number>('workdayStartHour') ?? 6;
    return getWorkdayRange(date, tz, startHour);
  }

  private paymentFilter(date: string, filter?: RoleFilter): Record<string, unknown> {
    const base: Record<string, unknown> = { paidDate: date };
    if (filter?.role === UserRole.Doctor && filter?.doctorId) {
      base.doctorId = toObjectIdOrThrow(filter.doctorId, 'doctorId');
    }
    return base;
  }

  private expenseFilter(date: string, filter?: RoleFilter): Record<string, unknown> {
    const base: Record<string, unknown> = { date };
    if (filter?.role === UserRole.Owner || filter?.role === UserRole.Admin) {
      return base;
    }
    if (filter?.userId) {
      base.createdBy = toObjectIdOrThrow(filter.userId, 'userId');
    }
    return base;
  }

  async findAll(date?: string) {
    const filter = date ? { date } : {};
    return this.dailyCloseoutModel.find(filter).populate('closedBy', 'name email').sort({ date: -1 }).lean();
  }

  async getByDate(date: string, roleFilter?: RoleFilter): Promise<Record<string, unknown>> {
    const closeout = await this.dailyCloseoutModel.findOne({ date }).populate('closedBy', 'name email').lean();
    if (!closeout) throw new NotFoundException('Closeout not found for this date');
    const breakdown = await this.getPreview(date, roleFilter);
    return { ...closeout, ...breakdown } as Record<string, unknown>;
  }

  /** Preview payments and expenses for a date (for closeout UI). Uses 6AM–6AM workday in clinic timezone. Includes dummy entries for invoices created in that workday with no payments. */
  async getPreview(date: string, roleFilter?: RoleFilter) {
    const payments = await this.invoicePaymentModel.find(this.paymentFilter(date, roleFilter)).lean();
    const { start: dayStart, end: dayEnd } = this.getWorkdayBounds(date);
    const invoicesCreatedThatDay = await this.invoiceModel
      .find({ createdAt: { $gte: dayStart, $lt: dayEnd } })
      .select('_id')
      .lean();
    const paidInvoiceIds = new Set(payments.map((p) => (p.invoiceId as Types.ObjectId).toString()));
    const dummyPayments = invoicesCreatedThatDay
      .filter((inv) => !paidInvoiceIds.has((inv._id as Types.ObjectId).toString()))
      .map((inv) => ({
        _id: inv._id,
        invoiceId: inv._id,
        amount: 0,
        method: PaymentMethod.Cash,
        paidAt: '',
        paidDate: date,
        beforeRemaining: 0,
        afterRemaining: 0,
        isDummy: true,
      }));
    const expenses = await this.expenseModel.find(this.expenseFilter(date, roleFilter)).lean();
    let cashCollected = 0, cardCollected = 0, transferCollected = 0;
    for (const p of payments) {
      if (p.method === PaymentMethod.Cash) cashCollected += p.amount;
      else if (p.method === PaymentMethod.Card) cardCollected += p.amount;
      else transferCollected += p.amount;
    }
    const totalCollected = cashCollected + cardCollected + transferCollected;
    const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
    return {
      payments: [...payments, ...dummyPayments],
      expenses,
      cashCollected,
      cardCollected,
      transferCollected,
      totalCollected,
      totalExpenses,
      finalBalance: totalCollected - totalExpenses,
    };
  }

  async removeByDate(date: string) {
    const closeout = await this.dailyCloseoutModel.findOne({ date });
    if (!closeout) throw new NotFoundException('Closeout not found for this date');
    await this.dailyCloseoutModel.findByIdAndDelete(closeout._id);
  }

  async updateByDate(date: string, dto: UpdateDailyCloseoutDto, roleFilter?: RoleFilter) {
    const closeout = await this.dailyCloseoutModel.findOne({ date });
    if (!closeout) throw new NotFoundException('Closeout not found for this date');
    if (dto.refreshExpenseSnapshot) {
      const expenses = await this.expenseModel.find(this.expenseFilter(date, roleFilter));
      closeout.expenseSnapshot = expenses.map((e) => ({
        expenseId: e._id,
        category: e.category,
        categoryAr: e.categoryAr,
        description: e.description,
        amount: e.amount,
      }));
      closeout.totalExpenses = closeout.expenseSnapshot.reduce((s, e) => s + e.amount, 0);
    }
    if (dto.cashCollected !== undefined) closeout.cashCollected = dto.cashCollected;
    if (dto.cardCollected !== undefined) closeout.cardCollected = dto.cardCollected;
    if (dto.transferCollected !== undefined) closeout.transferCollected = dto.transferCollected;
    if (dto.totalCollected !== undefined) closeout.totalCollected = dto.totalCollected;
    else if (
      dto.cashCollected !== undefined ||
      dto.cardCollected !== undefined ||
      dto.transferCollected !== undefined
    ) {
      closeout.totalCollected = closeout.cashCollected + closeout.cardCollected + closeout.transferCollected;
    }
    if (dto.totalExpenses !== undefined) closeout.totalExpenses = dto.totalExpenses;
    if (dto.finalBalance !== undefined) closeout.finalBalance = dto.finalBalance;
    else closeout.finalBalance = closeout.totalCollected - closeout.totalExpenses;
    await closeout.save();
    return this.dailyCloseoutModel.findById(closeout._id).populate('closedBy', 'name email').lean();
  }

  async create(date: string, closedBy: string, roleFilter?: RoleFilter) {
    const existing = await this.dailyCloseoutModel.findOne({ date });
    if (existing) throw new ConflictException('A closeout already exists for this date');
    const payments = await this.invoicePaymentModel.find(this.paymentFilter(date, roleFilter));
    let cashCollected = 0, cardCollected = 0, transferCollected = 0;
    for (const p of payments) {
      if (p.method === PaymentMethod.Cash) cashCollected += p.amount;
      else if (p.method === PaymentMethod.Card) cardCollected += p.amount;
      else transferCollected += p.amount;
    }
    const totalCollected = cashCollected + cardCollected + transferCollected;
    const expenses = await this.expenseModel.find(this.expenseFilter(date, roleFilter));
    const expenseSnapshot = expenses.map((e) => ({
      expenseId: e._id,
      category: e.category,
      categoryAr: e.categoryAr,
      description: e.description,
      amount: e.amount,
    }));
    const totalExpenses = expenseSnapshot.reduce((s, e) => s + e.amount, 0);
    const closedAt = new Date().toISOString();
    const closeout = await this.dailyCloseoutModel.create({
      date,
      closedBy: toObjectIdOrThrow(closedBy, 'closedBy'),
      cashCollected,
      cardCollected,
      transferCollected,
      totalCollected,
      expenseSnapshot,
      totalExpenses,
      finalBalance: totalCollected - totalExpenses,
      closedAt,
      currency: 'EGP',
    });
    return this.dailyCloseoutModel.findById(closeout._id).populate('closedBy', 'name email').lean();
  }
}
