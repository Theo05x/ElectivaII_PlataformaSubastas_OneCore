import { SubastaModel } from '../models/auction.model';

export interface SubastaData {
  sellerId?: string;
  article?: {
    title: string;
    description: string;
    conservationState: string;
  };
  category?: string;
  basePrice?: number;
  minimumIncrement?: number;
  endDate?: Date;
  status?: 'OPEN' | 'CLOSED' | 'CANCELLED' | 'DESIERTA' | 'PAID' | 'DEFAULTED';
  currentBidAmount?: number | null;
  currentBidderId?: string | null;
  winnerId?: string | null;
  winningBidAmount?: number | null;
}

export interface SubastaUpdateData {
  status?: SubastaData['status'];
  currentBidAmount?: number | null;
  currentBidderId?: string | null;
  winnerId?: string | null;
  winningBidAmount?: number | null;
}

export const findAll = async () => {
  return SubastaModel.find();
};

export const findById = async (id: string) => {
  return SubastaModel.findById(id);
};

export const findCategories = async () => {
  return SubastaModel.distinct('category');
};

export const findBySeller = async (sellerId: string) => {
  return SubastaModel.find({ sellerId });
};

export const findByIds = async (ids: string[]) => {
  return SubastaModel.find({ _id: { $in: ids } });
};

export const findByCategoryAndStatus = async (
  category: string | undefined,
  status: SubastaData['status'],
  skip: number,
  limit: number
) => {
  const filter: { category?: string; status?: SubastaData['status'] } = {};
  if (category) filter.category = category;
  if (status) filter.status = status;

  return SubastaModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit);
};

export const insert = async (data: SubastaData) => {
  return SubastaModel.create(data);
};

export const update = async (id: string, data: SubastaUpdateData) => {
  return SubastaModel.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  });
};
