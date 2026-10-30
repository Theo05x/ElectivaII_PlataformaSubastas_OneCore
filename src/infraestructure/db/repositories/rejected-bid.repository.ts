import { IntentoPujaRechazadoModel } from '../models/rejected-bid.model';

export interface IntentoPujaRechazadoData {
  auctionId: string;
  bidderId: string;
  amount: number;
  reason: string;
}

export const findAll = async () => {
  return IntentoPujaRechazadoModel.find();
};

export const findById = async (id: string) => {
  return IntentoPujaRechazadoModel.findById(id);
};

export const findByAuction = async (auctionId: string) => {
  return IntentoPujaRechazadoModel.find({ auctionId }).sort({ attemptedAt: -1 });
};

export const insert = async (data: IntentoPujaRechazadoData) => {
  return IntentoPujaRechazadoModel.create(data);
};
