import {
  AuctionEventPublisher,
  AuctionFilter,
  AuctionRepository,
  BidRepository,
  NotificationRepository,
  PaymentRepository,
} from '../ports/repository-ports';
import { Auction, NewAuction } from '../models/domain-types';
import { DomainValidationError, Money } from '../models/value-objects';
import {
  applyBid,
  cancelAuction,
  closeAuction,
  DomainRuleError,
  validateBid,
  validateNewAuction,
} from '../models/auction-rules';
import { ServiceError } from './service-error';

const HOUR = 60 * 60 * 1000;
const PAYMENT_WINDOW = 48 * HOUR;

export class AuctionService {
  constructor(
    private readonly auctions: AuctionRepository,
    private readonly bids: BidRepository,
    private readonly payments: PaymentRepository,
    private readonly notifications: NotificationRepository,
    private readonly events: AuctionEventPublisher | null
  ) {}

  async create(input: NewAuction): Promise<Auction> {
    validateNewAuction(input, Date.now());
    return this.auctions.create(input);
  }

  async list(filter: AuctionFilter): Promise<Auction[]> {
    if (
      !Number.isInteger(filter.skip) ||
      filter.skip < 0 ||
      !Number.isInteger(filter.limit) ||
      filter.limit < 1 ||
      filter.limit > 100
    ) {
      throw new ServiceError('INVALID_PAGINATION', 'La paginación no es válida.', 400);
    }
    const auctions = await this.auctions.findMany(filter);
    for (const auction of auctions) await this.closeIfDue(auction);
    return auctions;
  }

  categories(): Promise<string[]> {
    return this.auctions.findCategories();
  }

  async get(id: string): Promise<Auction> {
    const auction = await this.requireAuction(id);
    return this.closeIfDue(auction);
  }

  async cancel(id: string, sellerId: string): Promise<Auction> {
    const auction = await this.requireAuction(id);
    await this.closeIfDue(auction);
    cancelAuction(auction, sellerId);
    return this.auctions.save(auction);
  }

  async placeBid(id: string, bidderId: string, amount: number) {
    const auction = await this.requireAuction(id);
    await this.closeIfDue(auction);
    let bidAmount: Money;
    try {
      bidAmount = Money.create(amount);
      validateBid(auction, bidderId, bidAmount, Date.now());
    } catch (error) {
      if (
        !(error instanceof DomainValidationError) &&
        !(error instanceof DomainRuleError)
      ) {
        throw error;
      }
      await this.bids.createRejected({
        auctionId: id,
        bidderId,
        amount: Number.isFinite(amount) ? amount : 0,
        reason: error.message,
        attemptedAt: new Date(),
      });
      throw error;
    }

    const previousBidderId = applyBid(auction, bidderId, bidAmount);
    const bid = await this.bids.create(id, bidderId, bidAmount);
    await this.auctions.save(auction);

    this.events?.publish(id, 'bid.accepted', {
      bidderId,
      amount: bidAmount.amount,
      currentBidAmount: bidAmount.amount,
    });
    if (previousBidderId) {
      await this.notifications.create({
        userId: previousBidderId,
        type: 'BID_OUTBID',
        auctionId: id,
        message: 'Tu puja ha sido superada.',
      });
      this.events?.publish(id, 'bid.outbid', {
        bidderId: previousBidderId,
        amount: bidAmount.amount,
      });
    }

    return bid;
  }

  async bidHistory(id: string) {
    await this.get(id);
    return this.bids.findByAuction(id);
  }

  async rejectedBidHistory(id: string) {
    await this.requireAuction(id);
    return this.bids.findRejectedByAuction(id);
  }

  private async requireAuction(id: string): Promise<Auction> {
    const auction = await this.auctions.findById(id);
    if (!auction) throw new ServiceError('AUCTION_NOT_FOUND', 'Subasta no encontrada.', 404);
    return auction;
  }

  private async closeIfDue(auction: Auction): Promise<Auction> {
    const result = closeAuction(auction, Date.now());
    if (result === 'NOT_DUE') return auction;

    if (result === 'DESERTED') {
      await this.auctions.save(auction);
      this.events?.publish(auction.id, 'auction.closed', {
        status: auction.status.value,
        winnerId: null,
      });
      return auction;
    }

    if (auction.winnerId === null || auction.winningBidAmount === null) {
      throw new Error('La subasta adjudicada no tiene ganador o valor ganador.');
    }
    const winnerId = auction.winnerId;
    const winningBidAmount = auction.winningBidAmount;

    let order = await this.payments.findOrderByAuction(auction.id);
    if (!order) {
      order = await this.payments.createOrder({
        auctionId: auction.id,
        winnerId,
        amount: winningBidAmount,
        expirationDate: new Date(Date.now() + PAYMENT_WINDOW),
      });
    }

    await this.auctions.save(auction);
    await this.notifications.create({
      userId: winnerId,
      type: 'AUCTION_WON',
      auctionId: auction.id,
      orderId: order.id,
      message: 'Ganaste la subasta. Tienes 48 horas para realizar el pago.',
    });
    await this.notifications.create({
      userId: auction.sellerId,
      type: 'AUCTION_CLOSED',
      auctionId: auction.id,
      orderId: order.id,
      message: 'La subasta cerró y fue adjudicada.',
    });
    this.events?.publish(auction.id, 'auction.closed', {
      status: auction.status.value,
      winnerId,
      winningBidAmount: winningBidAmount.amount,
    });
    return auction;
  }
}
