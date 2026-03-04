import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Invoice } from './schemas/invoice.schema';
import { InvoicePayment } from './schemas/invoice-payment.schema';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { InvoiceStatus, DiscountType, PaymentMethod } from '../../enums';

function computeStatus(paid: number, total: number): InvoiceStatus {
  if (paid >= total || total === 0) return InvoiceStatus.Paid;
  if (paid > 0) return InvoiceStatus.Partial;
  return InvoiceStatus.Unpaid;
}

function applyDiscount(subtotal: number, discount: number, type: DiscountType): number {
  return type === DiscountType.Percentage ? Math.max(0, subtotal - (subtotal * discount) / 100) : Math.max(0, subtotal - discount);
}

function normalizeMethod(m: string): PaymentMethod {
  if (m === 'transfer') return PaymentMethod.Instapay;
  return Object.values(PaymentMethod).includes(m as PaymentMethod) ? (m as PaymentMethod) : PaymentMethod.Cash;
}

@Injectable()
export class InvoicesService {
  constructor(
    @InjectModel(Invoice.name) private invoiceModel: Model<Invoice>,
    @InjectModel(InvoicePayment.name) private paymentModel: Model<InvoicePayment>,
  ) {}

  async findAll(query: { patientId?: string; doctorId?: string; status?: string; includePayments?: boolean }, doctorIdFilter?: string) {
    const filter: Record<string, unknown> = {};
    if (query.patientId) filter.patientId = new Types.ObjectId(query.patientId);
    if (query.doctorId) filter.doctorId = new Types.ObjectId(query.doctorId);
    if (query.status) filter.status = query.status;
    if (doctorIdFilter) filter.doctorId = new Types.ObjectId(doctorIdFilter);
    const invoices = await this.invoiceModel
      .find(filter)
      .populate('patientId', 'name nameAr phone')
      .populate('doctorId', 'name nameAr color')
      .sort({ createdAt: -1 })
      .lean();
    if (query.includePayments && invoices.length > 0) {
      const ids = invoices.map((inv) => inv._id);
      const payments = await this.paymentModel.find({ invoiceId: { $in: ids } }).sort({ paidAt: 1 }).lean();
      const byInvoice = payments.reduce((acc, p) => {
        const key = (p.invoiceId as Types.ObjectId).toString();
        if (!acc[key]) acc[key] = [];
        acc[key].push(p);
        return acc;
      }, {} as Record<string, unknown[]>);
      return invoices.map((inv) => ({
        ...inv,
        payments: byInvoice[(inv._id as Types.ObjectId).toString()] ?? [],
      }));
    }
    return invoices;
  }

  async findOne(id: string, doctorIdFilter?: string): Promise<Record<string, unknown>> {
    const filter: Record<string, unknown> = { _id: new Types.ObjectId(id) };
    if (doctorIdFilter) filter.doctorId = new Types.ObjectId(doctorIdFilter);
    const invoice = await this.invoiceModel
      .findOne(filter)
      .populate('patientId', 'name nameAr phone')
      .populate('doctorId', 'name nameAr color')
      .lean();
    if (!invoice) throw new NotFoundException('Invoice not found');
    const payments = await this.paymentModel.find({ invoiceId: new Types.ObjectId(id) }).sort({ paidAt: 1 }).lean();
    return { ...invoice, payments };
  }

  async create(body: CreateInvoiceDto) {
    const items = body.items.map((i) => ({ ...i, total: i.quantity * i.unitPrice }));
    const subtotal = items.reduce((s, i) => s + i.total, 0);
    const discount = body.discount ?? 0;
    const discountType = body.discountType ?? DiscountType.Fixed;
    const total = applyDiscount(subtotal, discount, discountType);
    const paid = body.paid ?? 0;
    const remaining = Math.max(0, total - paid);
    const invoice = await this.invoiceModel.create({
      patientId: new Types.ObjectId(body.patientId),
      doctorId: new Types.ObjectId(body.doctorId),
      items,
      subtotal,
      discount,
      discountType,
      total,
      paid,
      remaining,
      status: computeStatus(paid, total),
      currency: body.currency ?? 'EGP',
      dueDate: body.dueDate,
    });
    if (paid > 0) {
      await this.paymentModel.create({
        invoiceId: invoice._id,
        patientId: invoice.patientId,
        doctorId: invoice.doctorId,
        amount: paid,
        method: normalizeMethod(body.paymentMethod ?? 'cash'),
        paidAt: new Date().toISOString(),
        paidDate: new Date().toISOString().slice(0, 10),
        beforeRemaining: total,
        afterRemaining: remaining,
        currency: invoice.currency,
      });
    }
    return this.invoiceModel.findById(invoice._id).populate('patientId', 'name nameAr phone').populate('doctorId', 'name nameAr color').lean();
  }

  async update(id: string, body: UpdateInvoiceDto, doctorIdFilter?: string) {
    const invoice = await this.invoiceModel.findById(id);
    if (!invoice) throw new NotFoundException('Invoice not found');
    if (doctorIdFilter && !invoice.doctorId.equals(new Types.ObjectId(doctorIdFilter))) throw new ForbiddenException('Forbidden');
    if (body.items && Array.isArray(body.items)) {
      const items = body.items.map((i) => ({ ...i, total: (i.quantity ?? 1) * (i.unitPrice ?? 0) }));
      invoice.items = items as never;
      invoice.subtotal = items.reduce((s, i) => s + i.total, 0);
      invoice.total = applyDiscount(invoice.subtotal, invoice.discount, invoice.discountType);
      invoice.remaining = Math.max(0, invoice.total - invoice.paid);
      invoice.status = computeStatus(invoice.paid, invoice.total);
    }
    await invoice.save();
    return this.invoiceModel.findById(id).populate('patientId', 'name nameAr phone').populate('doctorId', 'name nameAr color').lean();
  }

  async remove(id: string, doctorIdFilter?: string) {
    const invoice = await this.invoiceModel.findById(id);
    if (!invoice) throw new NotFoundException('Invoice not found');
    if (doctorIdFilter && !invoice.doctorId.equals(new Types.ObjectId(doctorIdFilter))) throw new ForbiddenException('Forbidden');
    await this.paymentModel.deleteMany({ invoiceId: id });
    await this.invoiceModel.findByIdAndDelete(id);
  }

  async listPayments(invoiceId: string, doctorIdFilter?: string) {
    const invoice = await this.invoiceModel.findById(invoiceId);
    if (!invoice) throw new NotFoundException('Invoice not found');
    if (doctorIdFilter && !invoice.doctorId.equals(new Types.ObjectId(doctorIdFilter))) throw new ForbiddenException('Forbidden');
    return this.paymentModel.find({ invoiceId }).sort({ paidAt: -1 }).lean();
  }

  async addPayment(invoiceId: string, amount: number, method: string, doctorIdFilter?: string) {
    const invoice = await this.invoiceModel.findById(invoiceId);
    if (!invoice) throw new NotFoundException('Invoice not found');
    if (doctorIdFilter && !invoice.doctorId.equals(new Types.ObjectId(doctorIdFilter))) throw new ForbiddenException('Forbidden');
    if (amount > invoice.remaining) throw new ForbiddenException('Amount exceeds remaining balance');
    const afterRemaining = invoice.remaining - amount;
    const paidAt = new Date().toISOString();
    const paidDate = paidAt.slice(0, 10);
    await this.paymentModel.create({
      invoiceId: invoice._id,
      patientId: invoice.patientId,
      doctorId: invoice.doctorId,
      amount,
      method: normalizeMethod(method),
      paidAt,
      paidDate,
      beforeRemaining: invoice.remaining,
      afterRemaining,
      currency: invoice.currency,
    });
    invoice.paid += amount;
    invoice.remaining = afterRemaining;
    invoice.status = computeStatus(invoice.paid, invoice.total);
    await invoice.save();
    return this.paymentModel.findOne({ invoiceId }).sort({ paidAt: -1 }).lean();
  }
}
