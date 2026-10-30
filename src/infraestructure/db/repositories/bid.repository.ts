import { PujaModel } from '../models/bid.model';

export interface PujaData {
  auctionId: string;
  bidderId: string;
  amount: number;
}

export const findAll = async () => {
  return PujaModel.find();
};

export const findById = async (id: string) => {
  return PujaModel.findById(id);
};

export const findByAuction = async (auctionId: string) => {
  return PujaModel.find({ auctionId }).sort({ placedAt: 1 });
};

export const findByBidder = async (bidderId: string) => {
  return PujaModel.find({ bidderId }).sort({ placedAt: -1 });
};

export const insert = async (data: PujaData) => {
  return PujaModel.create(data);
};
