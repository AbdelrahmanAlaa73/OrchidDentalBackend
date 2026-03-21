import { BadRequestException } from '@nestjs/common';
import { PaymentMethod } from '../../enums';
import { normalizePaymentMethod } from './payment-method.util';

describe('payment-method util', () => {
  it('normalizes cash/card/instapay', () => {
    expect(normalizePaymentMethod('cash')).toBe(PaymentMethod.Cash);
    expect(normalizePaymentMethod('card')).toBe(PaymentMethod.Card);
    expect(normalizePaymentMethod('instapay')).toBe(PaymentMethod.Instapay);
  });

  it('maps transfer to instapay', () => {
    expect(normalizePaymentMethod('transfer')).toBe(PaymentMethod.Instapay);
  });

  it('handles vodafone typos', () => {
    expect(normalizePaymentMethod('vodafonecash')).toBe(PaymentMethod.VodafoneCash);
    expect(normalizePaymentMethod('vodafonecase')).toBe(PaymentMethod.VodafoneCash);
    expect(normalizePaymentMethod('vodafonecashcase')).toBe(PaymentMethod.VodafoneCash);
  });

  it('returns undefined when no input', () => {
    expect(normalizePaymentMethod(undefined)).toBeUndefined();
  });

  it('throws for unsupported method', () => {
    expect(() => normalizePaymentMethod('crypto')).toThrow(BadRequestException);
  });
});
