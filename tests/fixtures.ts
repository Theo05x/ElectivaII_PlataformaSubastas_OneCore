import {
  Auction,
  Bid,
  Notification,
  PaymentOrder,
  RejectedBid,
} from "../src/domain/models/domain-types";
import {
  AuctionStatus,
  EmailAddress,
  Money,
  PaymentOrderStatus,
} from "../src/domain/models/value-objects";

export const makeAuction = (overrides: Partial<Auction> = {}): Auction => ({
  id: "auction-1",
  sellerId: "seller-1",
  article: {
    title: "Artículo",
    description: "Descripción",
    conservationState: "Bueno",
  },
  category: "General",
  basePrice: Money.create(100),
  minimumIncrement: Money.create(10),
  endDate: new Date(Date.now() + 60 * 60 * 1000),
  status: AuctionStatus.OPEN,
  currentBidAmount: null,
  currentBidderId: null,
  winnerId: null,
  winningBidAmount: null,
  ...overrides,
});

export const makeBid = (overrides: Partial<Bid> = {}): Bid => ({
  id: "bid-1",
  auctionId: "auction-1",
  bidderId: "bidder-1",
  amount: Money.create(100),
  placedAt: new Date(),
  ...overrides,
});

export const makePaymentOrder = (
  overrides: Partial<PaymentOrder> = {},
): PaymentOrder => ({
  id: "order-1",
  auctionId: "auction-1",
  winnerId: "bidder-1",
  amount: Money.create(120),
  expirationDate: new Date(Date.now() + 48 * 60 * 60 * 1000),
  status: PaymentOrderStatus.PENDING,
  transactionId: null,
  ...overrides,
});

export const notificationFor = (
  notification: Notification,
  userId: string,
  type: Notification["type"],
): boolean => notification.userId === userId && notification.type === type;

export const makeRejectedBid = (
  overrides: Partial<RejectedBid> = {},
): RejectedBid => ({
  auctionId: "auction-1",
  bidderId: "bidder-1",
  amount: 0,
  reason: "Rejected",
  attemptedAt: new Date(),
  ...overrides,
});

export const makeUser = (id = "user-1") => ({
  id,
  name: "Usuario",
  email: EmailAddress.create("usuario@example.com"),
  passwordHash: "stored-hash",
});
