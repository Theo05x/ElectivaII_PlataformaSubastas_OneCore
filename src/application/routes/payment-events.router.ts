import { Router } from 'express';
import { PaymentController } from '../controllers/payment.controller';

export const createPaymentEventsRouter = (controller: PaymentController) => {
  const paymentEventsRouter = Router();

  paymentEventsRouter.post('/', controller.procesarWebhookPago);

  return paymentEventsRouter;
};
