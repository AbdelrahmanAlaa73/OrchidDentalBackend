import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { toObjectIdOrThrow } from '../../common/utils/objectid';
import { DailyCloseout } from './schemas/daily-closeout.schema';
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
  ) {}

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

  async getByDate(date: string) {
    const closeout = await this.dailyCloseoutModel.findOne({ date }).populate('closedBy', 'name email').lean();
    if (!closeout) throw new NotFoundException('Closeout not found for this date');
    return closeout;
  }

  /** Preview payments and expenses for a date (for closeout UI). Includes dummy entries for invoices created that day with no payments. */
  async getPreview(date: string, roleFilter?: RoleFilter) {
    const payments = await this.invoicePaymentModel.find(this.paymentFilter(date, roleFilter)).lean();
    const dayStart = new Date(date + 'T00:00:00.000Z');
    const dayEnd = new Date(date + 'T23:59:59.999Z');
    const invoicesCreatedThatDay = await this.invoiceModel
      .find({ createdAt: { $gte: dayStart, $lte: dayEnd } })
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
