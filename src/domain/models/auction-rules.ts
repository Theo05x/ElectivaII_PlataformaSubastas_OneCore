import { Auction, NewAuction } from './domain-types';
import { AuctionStatus, Money } from './value-objects';

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

export class DomainRuleError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly statusCode: number
  ) {
    super(message);
    this.name = 'DomainRuleError';
  }
}

export const validateNewAuction = (auction: NewAuction, now: number): void => {
  if (auction.basePrice.amount <= 0) {
    throw new DomainRuleError('INVALID_BASE_PRICE', 'El precio base debe ser positivo y entero.', 400);
  }
  if (auction.minimumIncrement.amount <= 0) {
    throw new DomainRuleError('INVALID_INCREMENT', 'El incremento mínimo debe ser positivo y entero.', 400);
  }

  const duration = auction.endDate.getTime() - now;
  if (!Number.isFinite(duration) || duration < HOUR || duration > 30 * DAY) {
    throw new DomainRuleError(
      'INVALID_AUCTION_DURATION',
      'La subasta debe durar entre una hora y treinta días.',
      400
    );
  }
  if (
    !auction.article.title.trim() ||
    !auction.article.description.trim() ||
    !auction.article.conservationState.trim() ||
    !auction.category.trim()
  ) {
    throw new DomainRuleError(
      'INVALID_AUCTION',
      'Los datos del artículo y la categoría son requeridos.',
      400
    );
  }
};

export const validateBid = (
  auction: Auction,
  bidderId: string,
  amount: Money,
  now: number
): void => {
  if (amount.amount <= 0) {
    throw new DomainRuleError('INVALID_AMOUNT', 'La puja debe ser un valor entero positivo.', 400);
  }
  if (!auction.status.equals(AuctionStatus.OPEN)) {
    throw new DomainRuleError('AUCTION_NOT_OPEN', 'La subasta no está abierta.', 409);
  }
  if (auction.endDate.getTime() <= now) {
    throw new DomainRuleError('AUCTION_EXPIRED', 'La fecha de cierre de la subasta ya pasó.', 409);
  }
  if (auction.sellerId === bidderId) {
    throw new DomainRuleError('SELLER_CANNOT_BID', 'El vendedor no puede pujar en su subasta.', 409);
  }
  if (auction.currentBidderId === bidderId) {
    throw new DomainRuleError('SELF_OUTBID', 'No puedes superar tu propia puja vigente.', 409);
  }
  if (
    auction.currentBidAmount === null
      ? amount.isLessThan(auction.basePrice)
      : amount.isLessThan(auction.currentBidAmount.add(auction.minimumIncrement))
  ) {
    throw new DomainRuleError(
      auction.currentBidAmount === null ? 'BELOW_BASE_PRICE' : 'INSUFFICIENT_INCREMENT',
      auction.currentBidAmount === null
        ? 'La primera puja debe ser igual o superior al precio base.'
        : 'La puja debe superar la vigente al menos por el incremento mínimo.',
      409
    );
  }
};

export const applyBid = (auction: Auction, bidderId: string, amount: Money): string | null => {
  const previousBidderId = auction.currentBidderId;
  auction.currentBidAmount = amount;
  auction.currentBidderId = bidderId;
  return previousBidderId;
};

export const cancelAuction = (auction: Auction, sellerId: string): void => {
  if (auction.sellerId !== sellerId) {
    throw new DomainRuleError('NOT_AUCTION_OWNER', 'Solo el vendedor puede cancelar la subasta.', 403);
  }
  if (!auction.status.equals(AuctionStatus.OPEN)) {
    throw new DomainRuleError('AUCTION_NOT_OPEN', 'La subasta ya no está abierta.', 409);
  }
  if (auction.currentBidderId !== null) {
    throw new DomainRuleError('AUCTION_HAS_BIDS', 'No se puede cancelar una subasta que ya recibió pujas.', 409);
  }
  auction.status = AuctionStatus.CANCELLED;
};

export const closeAuction = (auction: Auction, now: number): 'NOT_DUE' | 'DESERTED' | 'AWARDED' => {
  if (!auction.status.equals(AuctionStatus.OPEN) || auction.endDate.getTime() > now) return 'NOT_DUE';

  if (auction.currentBidderId === null || auction.currentBidAmount === null) {
    auction.status = AuctionStatus.DESIERTA;
    return 'DESERTED';
  }

  auction.status = AuctionStatus.CLOSED;
  auction.winnerId = auction.currentBidderId;
  auction.winningBidAmount = auction.currentBidAmount;
  return 'AWARDED';
};
