import type {
  Auction,
  AuctionStatus,
  Bid,
  NewAuction,
  NewPaymentOrder,
  NewUser,
  Notification,
  PaymentEvent,
  PaymentOrder,
  RejectedBid,
  User,
} from '../models/domain-types';
import { EmailAddress, Money } from '../models/value-objects';

export interface AuctionFilter {
  category?: string;
  status?: AuctionStatus;
  skip: number;
  limit: number;
}

export interface UserRepository {
  findByEmail(email: EmailAddress): Promise<User | null>;
  create(user: NewUser): Promise<User>;
  findById(id: string): Promise<User | null>;
}

export interface AuctionRepository {
  create(auction: NewAuction): Promise<Auction>;
  findById(id: string): Promise<Auction | null>;
  findCategories(): Promise<string[]>;
  findBySeller(sellerId: string): Promise<Auction[]>;
  findByIds(ids: string[]): Promise<Auction[]>;
  findMany(filter: AuctionFilter): Promise<Auction[]>;
  save(auction: Auction): Promise<Auction>;
}

export interface BidRepository {
  create(auctionId: string, bidderId: string, amount: Money): Promise<Bid>;
  findByAuction(auctionId: string): Promise<Bid[]>;
  findByBidder(bidderId: string): Promise<Bid[]>;
  createRejected(bid: RejectedBid): Promise<void>;
  findRejectedByAuction(auctionId: string): Promise<RejectedBid[]>;
}

export interface PaymentRepository {
  findOrderById(id: string): Promise<PaymentOrder | null>;
  findOrderByAuction(auctionId: string): Promise<PaymentOrder | null>;
  createOrder(order: NewPaymentOrder): Promise<PaymentOrder>;
  saveOrder(order: PaymentOrder): Promise<PaymentOrder>;
  recordEvent(event: PaymentEvent): Promise<boolean>;
}

export interface NotificationRepository {
  create(notification: Notification): Promise<void>;
  findByUser(userId: string): Promise<Notification[]>;
}

export interface AuctionEventPublisher {
  publish(
    auctionId: string,
    event: string,
    payload: Record<string, string | number | null>
  ): void;
}

export interface PasswordService {
  hash(password: string): Promise<string>;
  verify(password: string, passwordHash: string): Promise<boolean>;
}

export interface TokenService {
  create(userId: string): string;
  verify(token: string): string | null;
}

export interface PaymentSignatureVerifier {
  verify(payload: string, signature: string): boolean;
}
