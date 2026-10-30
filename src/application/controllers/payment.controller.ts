import { Request, Response } from 'express';
import { PaymentService } from '../../domain/services/payment.service';
import { requireText, requireUserId } from './request-data';
import { ServiceError } from '../../domain/services/service-error';

export const createPaymentController = (paymentService: PaymentService) => ({
  obtenerOrdenPago: async (request: Request, response: Response) => {
    const order = await paymentService.getOrder(
      requireText(request.params.id, 'id'),
      requireUserId(request)
    );
    response.status(200).json({ status: 'success', data: order });
  },

  procesarWebhookPago: async (request: Request, response: Response) => {
    if (!Buffer.isBuffer(request.body)) {
      throw new ServiceError(
        'INVALID_WEBHOOK_BODY',
        'Envía el webhook con Content-Type: application/json.',
        415
      );
    }

    const signature = request.get('x-payment-signature');
    if (!signature) {
      throw new ServiceError(
        'WEBHOOK_SIGNATURE_REQUIRED',
        'Falta el encabezado X-Payment-Signature.',
        401
      );
    }

    const result = await paymentService.receiveWebhook(
      request.body.toString('utf8'),
      signature
    );
    response.status(200).json({ status: 'success', data: result });
  },
});

export type PaymentController = ReturnType<typeof createPaymentController>;
