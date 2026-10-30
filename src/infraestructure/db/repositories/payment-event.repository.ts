import { EventoPagoModel } from '../models/payment-event.model';

export interface EventoPagoData {
  providerEventId: string;
  orderId: string;
  transactionId: string;
  result: 'APPROVED' | 'DECLINED';
}

export const findAll = async () => {
  return EventoPagoModel.find();
};

export const findById = async (id: string) => {
  return EventoPagoModel.findById(id);
};

export const findByProviderEventId = async (providerEventId: string) => {
  return EventoPagoModel.findOne({ providerEventId });
};

export const insert = async (data: EventoPagoData) => {
  return EventoPagoModel.create(data);
};
