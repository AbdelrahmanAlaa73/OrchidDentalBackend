import { DiscountType, InvoiceStatus, PaymentMethod } from '../../enums';

export function computeStatus(paid: number, total: number): InvoiceStatus {
  if (paid >= total || total === 0) return InvoiceStatus.Paid;
  if (paid > 0) return InvoiceStatus.Partial;
  return InvoiceStatus.Unpaid;
}

export function applyDiscount(subtotal: number, discount: number, type: DiscountType): number {
  if (type === DiscountType.Percentage) {
    return Math.max(0, subtotal - (subtotal * discount) / 100);
  }
  return Math.max(0, subtotal - discount);
}

export function normalizeMethod(m: string): PaymentMethod {
  if (m === 'transfer') return PaymentMethod.Instapay;
  return Object.values(PaymentMethod).includes(m as PaymentMethod)
    ? (m as PaymentMethod)
    : PaymentMethod.Cash;
}
