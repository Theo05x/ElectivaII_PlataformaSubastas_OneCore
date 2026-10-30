import { PaymentOrder } from './domain-types';
import { PaymentOrderStatus } from './value-objects';

export const expirePaymentOrder = (order: PaymentOrder, now: number): boolean => {
  if (!order.status.equals(PaymentOrderStatus.PENDING) || order.expirationDate.getTime() > now) return false;
  order.status = PaymentOrderStatus.EXPIRED;
  return true;
};

export const confirmPayment = (order: PaymentOrder, transactionId: string): boolean => {
  if (!order.status.equals(PaymentOrderStatus.PENDING)) return false;
  order.status = PaymentOrderStatus.PAID;
  order.transactionId = transactionId;
  return true;
};
