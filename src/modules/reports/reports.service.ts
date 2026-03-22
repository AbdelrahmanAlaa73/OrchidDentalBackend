import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { toObjectIdOrThrow } from '../../common/utils/objectid';
import { getWorkdayRangeFromDateRange } from '../../common/utils/date-range.util';
import { InvoicePayment } from '../invoices/schemas/invoice-payment.schema';
import { Expense } from '../expenses/schemas/expense.schema';
import { Invoice } from '../invoices/schemas/invoice.schema';
import { PaymentMethod } from '../../enums';
import { ProcedurePricing } from '../procedure-pricing/schemas/procedure-pricing.schema';
import { Appointment } from '../appointments/schemas/appointment.schema';
import { Doctor } from '../doctors/schemas/doctor.schema';

const PERIOD = {
  DAILY: 'daily',
  WEEK: 'week',
  MONTH: 'month',
  SEMI_ANNUAL: 'semi_annual',
  YEAR: 'year',
} as const;

export type RevenueReportQuery = {
  startDate?: string;
  endDate?: string;
  doctorId?: string;
  period?: string;
};

type BreakdownItem = { count: number; totalAmount: number };

/** Line amount before invoice-level discount; uses stored total or unitPrice * quantity. */
function invoiceLineAmount(item: {
  total?: number;
  unitPrice?: number;
  quantity?: number;
}): number {
  if (item.total != null && !Number.isNaN(item.total)) return item.total;
  const q = item.quantity ?? 1;
  const up = item.unitPrice ?? 0;
  return q * up;
}

export type RevenueReportResult = {
  /** Sum of invoice subtotals (line totals before invoice-level discount). */
  totalSubtotal: number;
  /** Sum of invoice totals after discount (same as totalAfterDiscount). */
  totalRevenue: number;
  /** Alias for totalRevenue — amount after invoice-level discounts. */
  totalAfterDiscount: number;
  totalCollected: number;
  totalExpenses: number;
  netRevenue: number;
  doctorShare: number;
  clinicShare: number;
  collectedByPaymentMethod: {
    cash: number;
    card: number;
    vodafoneCash: number;
    instapay: number;
  };
  procedureBreakdown: Array<BreakdownItem & { procedure: string }>;
  expenseBreakdown: Array<BreakdownItem & { category: string }>;
  expenses: Array<Record<string, unknown>>;
  dailyBreakdown: Array<{
    date: string;
    revenue: number;
    expenses: number;
    appointmentCount: number;
  }>;
};

@Injectable()
export class ReportsService {
  constructor(
    @InjectModel(InvoicePayment.name) private invoicePaymentModel: Model<InvoicePayment>,
    @InjectModel(Expense.name) private expenseModel: Model<Expense>,
    @InjectModel(Invoice.name) private invoiceModel: Model<Invoice>,
    @InjectModel(ProcedurePricing.name) private procedurePricingModel: Model<ProcedurePricing>,
    @InjectModel(Appointment.name) private appointmentModel: Model<Appointment>,
    @InjectModel(Doctor.name) private doctorModel: Model<Doctor>,
    private configService: ConfigService,
  ) {}

  private getWorkdayBounds(startDate: string, endDate: string): { start: Date; end: Date } {
    const tz = this.configService.get<string>('clinicTimezone') ?? 'Africa/Cairo';
    const startHour = this.configService.get<number>('workdayStartHour') ?? 6;
    return getWorkdayRangeFromDateRange(startDate, endDate, tz, startHour);
  }

  /** Resolves start/end date from query (period or explicit dates). Defaults to last month. */
  private resolveDateRange(query: RevenueReportQuery): { start: string; end: string } {
    const today = new Date().toISOString().slice(0, 10);
    let start = query.startDate;
    let end = query.endDate;

    if (query.period === PERIOD.DAILY && !start && !end) {
      return { start: today, end: today };
    }
    if (query.period === PERIOD.MONTH && !end) {
      end = today;
      const d = new Date(end);
      d.setMonth(d.getMonth() - 1);
      start = start ?? d.toISOString().slice(0, 10);
      return { start, end };
    }
    if (query.period === PERIOD.WEEK && !end) {
      end = today;
      const d = new Date(end);
      d.setDate(d.getDate() - 7);
      start = start ?? d.toISOString().slice(0, 10);
      return { start, end };
    }
    if (query.period === PERIOD.SEMI_ANNUAL && !end) {
      end = today;
      const d = new Date(end);
      d.setMonth(d.getMonth() - 6);
      start = start ?? d.toISOString().slice(0, 10);
      return { start, end };
    }
    if (query.period === PERIOD.YEAR && !end) {
      end = today;
      const d = new Date(end);
      d.setMonth(0);
      d.setDate(1);
      start = start ?? d.toISOString().slice(0, 10);
      return { start, end };
    }
    if (!start || !end) {
      end = end ?? today;
      const d = new Date(end);
      d.setMonth(d.getMonth() - 1);
      start = start ?? d.toISOString().slice(0, 10);
    }
    return { start, end };
  }

  async getRevenueReport(query: RevenueReportQuery): Promise<RevenueReportResult> {
    const { start, end } = this.resolveDateRange(query);
    const { start: dayStart, end: dayEnd } = this.getWorkdayBounds(start, end);
    const doctorIdFilter = query.doctorId ? { doctorId: toObjectIdOrThrow(query.doctorId, 'doctorId') } : {};

    const [invoices, payments, expenses, doctors, appointmentsByDate] = await Promise.all([
      this.invoiceModel
        .find({ createdAt: { $gte: dayStart, $lt: dayEnd }, ...doctorIdFilter })
        .lean(),
      this.invoicePaymentModel
        .find({ paidDate: { $gte: start, $lte: end }, ...doctorIdFilter })
        .lean(),
      this.expenseModel
        .find({
          $expr: {
            $and: [
              { $gte: [{ $substr: [{ $ifNull: ['$date', ''] }, 0, 10] }, start] },
              { $lte: [{ $substr: [{ $ifNull: ['$date', ''] }, 0, 10] }, end] },
            ],
          },
        })
        .lean(),
      this.doctorModel.find().select('_id clinicSharePercent doctorSharePercent').lean(),
      this.appointmentModel.aggregate<{ _id: string; count: number }>([
        { $match: { date: { $gte: start, $lte: end }, ...doctorIdFilter } },
        { $group: { _id: '$date', count: { $sum: 1 } } },
      ]),
    ]);

    const totalSubtotal = invoices.reduce((sum, inv) => sum + (inv.subtotal ?? 0), 0);
    const totalRevenue = invoices.reduce((sum, inv) => sum + (inv.total ?? 0), 0);
    const totalCollected = payments.reduce((sum, p) => sum + p.amount, 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

    const collectedByPaymentMethod = {
      cash: 0,
      card: 0,
      vodafoneCash: 0,
      instapay: 0,
    };
    for (const p of payments) {
      if (p.method === PaymentMethod.Cash) collectedByPaymentMethod.cash += p.amount;
      else if (p.method === PaymentMethod.Card) collectedByPaymentMethod.card += p.amount;
      else if (p.method === PaymentMethod.VodafoneCash) collectedByPaymentMethod.vodafoneCash += p.amount;
      else collectedByPaymentMethod.instapay += p.amount;
    }

    const doctorPercentMap = new Map(
      doctors.map((d) => [
        (d._id as unknown as string).toString(),
        {
          doctorPercent: (d as { doctorSharePercent?: number }).doctorSharePercent ?? 80,
          clinicPercent: (d as { clinicSharePercent?: number }).clinicSharePercent ?? 20,
        },
      ]),
    );

    let doctorShare = 0;
    let clinicShare = 0;
    const procedureBreakdown: Record<string, BreakdownItem> = {};
    for (const inv of invoices) {
      const doctorIdStr = String(inv.doctorId);
      const pricing = doctorPercentMap.get(doctorIdStr) ?? { doctorPercent: 80, clinicPercent: 20 };
      for (const item of inv.items ?? []) {
        const lineTotal = invoiceLineAmount(item);
        doctorShare += (lineTotal * pricing.doctorPercent) / 100;
        clinicShare += (lineTotal * pricing.clinicPercent) / 100;
        const key = item.procedure;
        if (!procedureBreakdown[key]) procedureBreakdown[key] = { count: 0, totalAmount: 0 };
        procedureBreakdown[key].count += item.quantity ?? 1;
        procedureBreakdown[key].totalAmount += lineTotal;
      }
    }

    const expenseBreakdown = expenses.reduce<Record<string, BreakdownItem>>((acc, e) => {
      if (!acc[e.category]) acc[e.category] = { count: 0, totalAmount: 0 };
      acc[e.category].count += 1;
      acc[e.category].totalAmount += e.amount;
      return acc;
    }, {});

    const dailyRev: Record<string, number> = {};
    payments.forEach((p) => (dailyRev[p.paidDate] = (dailyRev[p.paidDate] ?? 0) + p.amount));
    const dailyExp: Record<string, number> = {};
    expenses.forEach((e) => {
      const dateKey = typeof e.date === 'string' ? e.date.slice(0, 10) : '';
      if (dateKey) dailyExp[dateKey] = (dailyExp[dateKey] ?? 0) + e.amount;
    });
    const dailyApp: Record<string, number> = {};
    appointmentsByDate.forEach((a) => (dailyApp[a._id] = a.count));

    const allDates = new Set([...Object.keys(dailyRev), ...Object.keys(dailyExp), ...Object.keys(dailyApp)]);
    const dailyBreakdown = [...allDates]
      .filter((d) => d >= start && d <= end)
      .sort()
      .map((date) => ({
        date,
        revenue: dailyRev[date] ?? 0,
        expenses: dailyExp[date] ?? 0,
        appointmentCount: dailyApp[date] ?? 0,
      }));

    return {
      totalSubtotal,
      totalRevenue,
      totalAfterDiscount: totalRevenue,
      totalCollected,
      totalExpenses,
      netRevenue: totalCollected - totalExpenses,
      doctorShare,
      clinicShare,
      collectedByPaymentMethod,
      procedureBreakdown: Object.entries(procedureBreakdown).map(([procedure, data]) => ({ procedure, ...data })),
      expenseBreakdown: Object.entries(expenseBreakdown).map(([category, data]) => ({ category, ...data })),
      expenses: expenses as Array<Record<string, unknown>>,
      dailyBreakdown,
    };
  }
}
