import {
  AuctionStatus,
  EmailAddress,
  Money,
  PaymentOrderStatus,
} from './value-objects';

export { AuctionStatus, EmailAddress, Money, PaymentOrderStatus } from './value-objects';

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
  basePrice: Money;
  minimumIncrement: Money;
  endDate: Date;
  status: AuctionStatus;
  currentBidAmount: Money | null;
  currentBidderId: string | null;
  winnerId: string | null;
  winningBidAmount: Money | null;
}

export interface NewAuction {
  sellerId: string;
  article: Article;
  category: string;
  basePrice: Money;
  minimumIncrement: Money;
  endDate: Date;
}

export interface User {
  id: string;
  name: string;
  email: EmailAddress;
  passwordHash: string;
}

export interface NewUser {
  name: string;
  email: EmailAddress;
  passwordHash: string;
}

export interface Bid {
  id: string;
  auctionId: string;
  bidderId: string;
  amount: Money;
  placedAt: Date;
}

export interface RejectedBid {
  auctionId: string;
  bidderId: string;
  amount: number;
  reason: string;
  attemptedAt: Date;
}

export interface PaymentOrder {
  id: string;
  auctionId: string;
  winnerId: string;
  amount: Money;
  expirationDate: Date;
  status: PaymentOrderStatus;
  transactionId: string | null;
}

export interface NewPaymentOrder {
  auctionId: string;
  winnerId: string;
  amount: Money;
  expirationDate: Date;
}

export interface PaymentEvent {
  providerEventId: string;
  orderId: string;
  transactionId: string;
  result: 'APPROVED' | 'DECLINED';
}

export interface Notification {
  id?: string;
  userId: string;
  type:
    | 'BID_OUTBID'
    | 'AUCTION_WON'
    | 'AUCTION_CLOSED'
    | 'PAYMENT_CONFIRMED'
    | 'PAYMENT_EXPIRED';
  auctionId?: string;
  orderId?: string;
  message: string;
  read?: boolean;
  createdAt?: Date;
}