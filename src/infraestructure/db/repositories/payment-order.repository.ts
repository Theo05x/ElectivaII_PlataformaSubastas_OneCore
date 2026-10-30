import { OrdenPagoModel } from '../models/payment-order.model';

export interface OrdenPagoData {
  auctionId: string;
  winnerId: string;
  amount: number;
  expirationDate: Date;
  status?: 'PENDING' | 'PAID' | 'EXPIRED';
  transactionId?: string | null;
}

export const findAll = async () => {
  return OrdenPagoModel.find();
};

export const findById = async (id: string) => {
  return OrdenPagoModel.findById(id);
};

export const findByAuction = async (auctionId: string) => {
  return OrdenPagoModel.findOne({ auctionId });
};

export const findByWinner = async (winnerId: string) => {
  return OrdenPagoModel.find({ winnerId });
};

export const insert = async (data: OrdenPagoData) => {
  return OrdenPagoModel.create(data);
};

export const update = async (
  id: string,
  data: Pick<OrdenPagoData, 'status' | 'transactionId'>
) => {
  return OrdenPagoModel.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  });
};
