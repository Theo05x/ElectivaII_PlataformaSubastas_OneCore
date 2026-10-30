import { Router } from 'express';
import { RequestHandler } from 'express';
import { PaymentController } from '../controllers/payment.controller';

export const createPaymentRouter = (
  controller: PaymentController,
  authenticateToken: RequestHandler
) => {
  const paymentRouter = Router();

  paymentRouter.get('/:id', authenticateToken, controller.obtenerOrdenPago);

  return paymentRouter;
};