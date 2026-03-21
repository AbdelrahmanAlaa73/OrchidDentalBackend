import { BadRequestException } from '@nestjs/common';
import { PaymentMethod } from '../../enums';

export function normalizePaymentMethod(method?: string): PaymentMethod | undefined {
  if (!method) return undefined;
  const normalized = method
    .trim()
    .toLowerCase()
    .replace(/[\s_-]/g, '');

  if (normalized === 'cash') return PaymentMethod.Cash;
  if (normalized === 'card') return PaymentMethod.Card;
  if (normalized === 'instapay' || normalized === 'transfer') return PaymentMethod.Instapay;
  if (
    normalized === 'vodafonecash' ||
    normalized === 'vodafonecase' ||
    normalized === 'vodafonecashcase' ||
    normalized === 'vodafone'
  ) {
    return PaymentMethod.VodafoneCash;
  }
  if (Object.values(PaymentMethod).includes(method.trim() as PaymentMethod)) {
    return method.trim() as PaymentMethod;
  }
  throw new BadRequestException('paymentMethod must be one of: cash, card, vodafone_cash, instapay');
}
