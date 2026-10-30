import {
  AuctionRepository,
  NotificationRepository,
  PaymentRepository,
  PaymentSignatureVerifier,
} from '../ports/repository-ports';
import { PaymentEvent, PaymentOrder } from '../models/domain-types';
import { AuctionStatus, PaymentOrderStatus } from '../models/value-objects';
import { confirmPayment, expirePaymentOrder } from '../models/payment-rules';
import { ServiceError } from './service-error';

export class PaymentService {
  constructor(
    private readonly payments: PaymentRepository,
    private readonly auctions: AuctionRepository,
    private readonly notifications: NotificationRepository,
    private readonly signatureVerifier: PaymentSignatureVerifier | null
  ) {}

  async getOrder(orderId: string, userId: string) {
    const order = await this.payments.findOrderById(orderId);
    if (!order) throw new ServiceError('ORDER_NOT_FOUND', 'Orden de pago no encontrada.', 404);
    if (order.winnerId !== userId) {
      throw new ServiceError('NOT_ORDER_OWNER', 'Solo el ganador puede consultar esta orden.', 403);
    }
    await this.expireIfDue(order);
    return order;
  }

  async receiveWebhook(payload: string, signature: string) {
    if (!this.signatureVerifier) {
      throw new ServiceError(
        'WEBHOOK_NOT_CONFIGURED',
        'El webhook no está configurado en el servidor.',
        503
      );
    }
    if (!this.signatureVerifier.verify(payload, signature)) {
      throw new ServiceError('INVALID_WEBHOOK_SIGNATURE', 'Firma del webhook inválida.', 401);
    }

    const event = this.parseEvent(payload);
    const order = await this.payments.findOrderById(event.orderId);
    if (!order) throw new ServiceError('ORDER_NOT_FOUND', 'Orden de pago no encontrada.', 404);
    await this.expireIfDue(order);

    const isNewEvent = await this.payments.recordEvent(event);
    if (!isNewEvent) return { received: true, duplicate: true };

    if (!order.status.equals(PaymentOrderStatus.PENDING)) {
      return { received: true, duplicate: false };
    }

    if (event.result === 'APPROVED' && confirmPayment(order, event.transactionId)) {
      await this.payments.saveOrder(order);
      const auction = await this.auctions.findById(order.auctionId);
      if (auction) {
        auction.status = AuctionStatus.PAID;
        await this.auctions.save(auction);
      }

      await this.notifications.create({
        userId: order.winnerId,
        type: 'PAYMENT_CONFIRMED',
        auctionId: order.auctionId,
        orderId: order.id,
        message: 'El pago fue confirmado.',
      });
      if (auction) {
        await this.notifications.create({
          userId: auction.sellerId,
          type: 'PAYMENT_CONFIRMED',
          auctionId: auction.id,
          orderId: order.id,
          message: 'El ganador completó el pago de la subasta.',
        });
      }
    }

    return { received: true, duplicate: false };
  }

  private parseEvent(payload: string): PaymentEvent {
    let parsed: unknown;
    try {
      parsed = JSON.parse(payload);
    } catch {
      throw new ServiceError('INVALID_WEBHOOK_PAYLOAD', 'El contenido del webhook no es JSON válido.', 400);
    }

    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      !('providerEventId' in parsed) ||
      !('orderId' in parsed) ||
      !('transactionId' in parsed) ||
      !('result' in parsed) ||
      typeof parsed.providerEventId !== 'string' ||
      !parsed.providerEventId.trim() ||
      typeof parsed.orderId !== 'string' ||
      !parsed.orderId.trim() ||
      typeof parsed.transactionId !== 'string' ||
      !parsed.transactionId.trim() ||
      (parsed.result !== 'APPROVED' && parsed.result !== 'DECLINED')
    ) {
      throw new ServiceError('INVALID_WEBHOOK_PAYLOAD', 'Los datos del evento de pago no son válidos.', 400);
    }

    return {
      providerEventId: parsed.providerEventId,
      orderId: parsed.orderId,
      transactionId: parsed.transactionId,
      result: parsed.result,
    };
  }

  private async expireIfDue(order: PaymentOrder): Promise<void> {
    if (!expirePaymentOrder(order, Date.now())) return;

    await this.payments.saveOrder(order);

    const auction = await this.auctions.findById(order.auctionId);
    if (auction && auction.status.equals(AuctionStatus.CLOSED)) {
      auction.status = AuctionStatus.DEFAULTED;
      await this.auctions.save(auction);
    }
    await this.notifications.create({
      userId: order.winnerId,
      type: 'PAYMENT_EXPIRED',
      auctionId: order.auctionId,
      orderId: order.id,
      message: 'El plazo de pago venció.',
    });
  }
}
