export type AuctionStatus = 'OPEN' | 'CLOSED' | 'CANCELLED' | 'DESIERTA' | 'PAID' | 'DEFAULTED';
export type OrderStatus = 'PENDING' | 'PAID' | 'EXPIRED';

export interface Article {
  title: string;
  description: string;
  conservationState: string;
}

export interface Auction {
  id: string;
  sellerId: string;
  article: Article;
  category: string;
  basePrice: number;
  minimumIncrement: number;
  endDate: string;
  status: AuctionStatus;
  currentBidAmount: number | null;
  currentBidderId: string | null;
  winnerId: string | null;
  winningBidAmount: number | null;
}

export interface Bid {
  id: string;
  auctionId: string;
  bidderId: string;
  amount: number;
  placedAt: string;
}

export interface AuctionDetails extends Auction {
  bidsHistory: Bid[];
}

export interface UserProfile {
  user: { id: string; name: string; email: string };
  publishedAuctions: Auction[];
  participatedAuctions: Auction[];
}

export interface NotificationItem {
  id: string;
  userId: string;
  type: 'BID_OUTBID' | 'AUCTION_WON' | 'AUCTION_CLOSED' | 'PAYMENT_CONFIRMED' | 'PAYMENT_EXPIRED';
  auctionId?: string;
  orderId?: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface PaymentOrder {
  id: string;
  auctionId: string;
  winnerId: string;
  amount: number;
  expirationDate: string;
  status: OrderStatus;
  transactionId: string | null;
}

export interface ApiEnvelope<T> {
  status: 'success';
  data: T;
}

export interface PageEnvelope<T> extends ApiEnvelope<T> {
  pagination: { page: number; limit: number; results: number };
}

export interface ApiErrorPayload {
  status?: string;
  error?: { code?: string; message?: string };
}
