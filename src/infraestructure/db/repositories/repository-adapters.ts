import {
  AuctionRepository,
  BidRepository,
  NotificationRepository,
  PaymentRepository,
  UserRepository,
} from '../../../domain/ports/repository-ports';
import { Auction } from '../../../domain/models/domain-types';
import {
  AuctionStatus,
  EmailAddress,
  Money,
  PaymentOrderStatus,
} from '../../../domain/models/value-objects';
import * as auctionRepository from './auction.repository';
import * as bidRepository from './bid.repository';
import * as rejectedBidRepository from './rejected-bid.repository';
import * as paymentOrderRepository from './payment-order.repository';
import * as paymentEventRepository from './payment-event.repository';
import * as notificationRepository from './notification.repository';
import * as userRepository from './user.repository';

const toAuction = (
  document: NonNullable<Awaited<ReturnType<typeof auctionRepository.findById>>>
): Auction => {
  if (!document.article) throw new Error('La subasta no tiene datos del artículo.');
  return {
    id: document._id.toString(),
    sellerId: document.sellerId.toString(),
    article: document.article,
    category: document.category,
    basePrice: Money.create(document.basePrice),
    minimumIncrement: Money.create(document.minimumIncrement),
    endDate: document.endDate,
    status: AuctionStatus.from(document.status),
    currentBidAmount:
      document.currentBidAmount === null || document.currentBidAmount === undefined
        ? null
        : Money.create(document.currentBidAmount),
    currentBidderId: document.currentBidderId?.toString() ?? null,
    winnerId: document.winnerId?.toString() ?? null,
    winningBidAmount:
      document.winningBidAmount === null || document.winningBidAmount === undefined
        ? null
        : Money.create(document.winningBidAmount),
  };
};

const toPaymentOrder = (
  document: NonNullable<Awaited<ReturnType<typeof paymentOrderRepository.findById>>>
) => ({
  id: document._id.toString(),
  auctionId: document.auctionId.toString(),
  winnerId: document.winnerId.toString(),
  amount: Money.create(document.amount),
  expirationDate: document.expirationDate,
  status: PaymentOrderStatus.from(document.status),
  transactionId: document.transactionId ?? null,
});

export const mongoUserRepository: UserRepository = {
  async findByEmail(email) {
    const user = await userRepository.findByEmail(email.value);
    if (!user) return null;
    return {
      id: user._id.toString(),
      name: user.name,
      email: EmailAddress.create(user.email),
      passwordHash: user.passwordHash,
    };
  },
  async create(data) {
    const user = await userRepository.insert({
      ...data,
      email: data.email.value,
    });
    return {
      id: user._id.toString(),
      name: user.name,
      email: EmailAddress.create(user.email),
      passwordHash: data.passwordHash,
    };
  },
  async findById(id) {
    const user = await userRepository.findById(id);
    if (!user) return null;
    return {
      id: user._id.toString(),
      name: user.name,
      email: EmailAddress.create(user.email),
      passwordHash: '',
    };
  },
};

export const mongoAuctionRepository: AuctionRepository = {
  async create(data) {
    const auction = await auctionRepository.insert({
      ...data,
      basePrice: data.basePrice.amount,
      minimumIncrement: data.minimumIncrement.amount,
    });
    return toAuction(auction);
  },
  async findById(id) {
    const auction = await auctionRepository.findById(id);
    return auction ? toAuction(auction) : null;
  },
  async findCategories() {
    return auctionRepository.findCategories();
  },
  async findBySeller(sellerId) {
    const auctions = await auctionRepository.findBySeller(sellerId);
    return auctions.map(toAuction);
  },
  async findByIds(ids) {
    const auctions = await auctionRepository.findByIds(ids);
    return auctions.map(toAuction);
  },
  async findMany(filter) {
    const auctions = await auctionRepository.findByCategoryAndStatus(
      filter.category,
      filter.status?.value,
      filter.skip,
      filter.limit
    );
    return auctions.map(toAuction);
  },
  async save(auction) {
    const saved = await auctionRepository.update(auction.id, {
      status: auction.status.value,
      currentBidAmount: auction.currentBidAmount?.amount ?? null,
      currentBidderId: auction.currentBidderId,
      winnerId: auction.winnerId,
      winningBidAmount: auction.winningBidAmount?.amount ?? null,
    });
    if (!saved) throw new Error('No fue posible actualizar la subasta.');
    return toAuction(saved);
  },
};

export const mongoBidRepository: BidRepository = {
  async create(auctionId, bidderId, amount) {
    const bid = await bidRepository.insert({ auctionId, bidderId, amount: amount.amount });
    return {
      id: bid._id.toString(),
      auctionId: bid.auctionId.toString(),
      bidderId: bid.bidderId.toString(),
      amount: Money.create(bid.amount),
      placedAt: bid.placedAt,
    };
  },
  async findByAuction(auctionId) {
    const bids = await bidRepository.findByAuction(auctionId);
    return bids.map(bid => ({
      id: bid._id.toString(),
      auctionId: bid.auctionId.toString(),
      bidderId: bid.bidderId.toString(),
      amount: Money.create(bid.amount),
      placedAt: bid.placedAt,
    }));
  },
  async findByBidder(bidderId) {
    const bids = await bidRepository.findByBidder(bidderId);
    return bids.map(bid => ({
      id: bid._id.toString(),
      auctionId: bid.auctionId.toString(),
      bidderId: bid.bidderId.toString(),
      amount: Money.create(bid.amount),
      placedAt: bid.placedAt,
    }));
  },
  async createRejected(data) {
    await rejectedBidRepository.insert(data);
  },
  async findRejectedByAuction(auctionId) {
    const bids = await rejectedBidRepository.findByAuction(auctionId);
    return bids.map(bid => ({
      auctionId: bid.auctionId.toString(),
      bidderId: bid.bidderId.toString(),
      amount: bid.amount,
      reason: bid.reason,
      attemptedAt: bid.attemptedAt,
    }));
  },
};

export const mongoPaymentRepository: PaymentRepository = {
  async findOrderById(id) {
    const order = await paymentOrderRepository.findById(id);
    return order ? toPaymentOrder(order) : null;
  },
  async findOrderByAuction(auctionId) {
    const order = await paymentOrderRepository.findByAuction(auctionId);
    return order ? toPaymentOrder(order) : null;
  },
  async createOrder(data) {
    const order = await paymentOrderRepository.insert({
      ...data,
      amount: data.amount.amount,
    });
    return toPaymentOrder(order);
  },
  async saveOrder(order) {
    const saved = await paymentOrderRepository.update(order.id, {
      status: order.status.value,
      transactionId: order.transactionId,
    });
    if (!saved) throw new Error('No fue posible actualizar la orden de pago.');
    return toPaymentOrder(saved);
  },
  async recordEvent(event) {
    try {
      await paymentEventRepository.insert(event);
      return true;
    } catch (error) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === 11000
      ) {
        return false;
      }
      throw error;
    }
  },
};

export const mongoNotificationRepository: NotificationRepository = {
  async create(data) {
    await notificationRepository.insert(data);
  },
  async findByUser(userId) {
    const notifications = await notificationRepository.findByUser(userId);
    return notifications.map(notification => ({
      id: notification._id.toString(),
      userId: notification.userId.toString(),
      type: notification.type,
      auctionId: notification.auctionId?.toString(),
      orderId: notification.orderId?.toString(),
      message: notification.message,
      read: notification.read,
      createdAt: notification.createdAt,
    }));
  },
};
