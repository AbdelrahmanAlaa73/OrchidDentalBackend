import { DiscountType, InvoiceStatus, PaymentMethod } from '../../enums';
import { applyDiscount, computeStatus, normalizeMethod } from './invoice-helpers';

describe('invoice helpers', () => {
  describe('computeStatus', () => {
    it('returns paid when paid >= total', () => {
      expect(computeStatus(100, 100)).toBe(InvoiceStatus.Paid);
      expect(computeStatus(120, 100)).toBe(InvoiceStatus.Paid);
    });

    it('returns paid when total is zero', () => {
      expect(computeStatus(0, 0)).toBe(InvoiceStatus.Paid);
    });

    it('returns partial when partially paid', () => {
      expect(computeStatus(1, 100)).toBe(InvoiceStatus.Partial);
      expect(computeStatus(99.99, 100)).toBe(InvoiceStatus.Partial);
    });

    it('returns unpaid when paid is zero', () => {
      expect(computeStatus(0, 100)).toBe(InvoiceStatus.Unpaid);
    });
  });

  describe('applyDiscount', () => {
    it('applies percentage discounts', () => {
      expect(applyDiscount(100, 10, DiscountType.Percentage)).toBe(90);
      expect(applyDiscount(100, 100, DiscountType.Percentage)).toBe(0);
      expect(applyDiscount(100, 150, DiscountType.Percentage)).toBe(0);
      expect(applyDiscount(99.5, 10, DiscountType.Percentage)).toBeCloseTo(89.55, 5);
    });

    it('applies fixed discounts with floor at zero', () => {
      expect(applyDiscount(100, 25, DiscountType.Fixed)).toBe(75);
      expect(applyDiscount(100, 100, DiscountType.Fixed)).toBe(0);
      expect(applyDiscount(100, 150, DiscountType.Fixed)).toBe(0);
    });
  });

  describe('normalizeMethod', () => {
    it('maps transfer to instapay', () => {
      expect(normalizeMethod('transfer')).toBe(PaymentMethod.Instapay);
    });

    it('keeps valid methods unchanged', () => {
      expect(normalizeMethod('cash')).toBe(PaymentMethod.Cash);
      expect(normalizeMethod('card')).toBe(PaymentMethod.Card);
      expect(normalizeMethod('instapay')).toBe(PaymentMethod.Instapay);
      expect(normalizeMethod('vodafone_cash')).toBe(PaymentMethod.VodafoneCash);
    });

    it('falls back to cash for unknown methods', () => {
      expect(normalizeMethod('anything-else')).toBe(PaymentMethod.Cash);
    });
  });
});
