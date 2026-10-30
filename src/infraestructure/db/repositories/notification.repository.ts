import { NotificacionModel } from '../models/notification.model';

export interface NotificacionData {
  userId: string;
  type:
    | 'BID_OUTBID'
    | 'AUCTION_WON'
    | 'AUCTION_CLOSED'
    | 'PAYMENT_CONFIRMED'
    | 'PAYMENT_EXPIRED';
  auctionId?: string | null;
  orderId?: string | null;
  message: string;
  read?: boolean;
}

export const findAll = async () => {
  return NotificacionModel.find();
};

export const findById = async (id: string) => {
  return NotificacionModel.findById(id);
};

export const findByUser = async (userId: string) => {
  return NotificacionModel.find({ userId }).sort({ createdAt: -1 });
};

export const insert = async (data: NotificacionData) => {
  return NotificacionModel.create(data);
};
