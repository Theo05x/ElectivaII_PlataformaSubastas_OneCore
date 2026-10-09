import { Router } from 'express';
import { obtenerOrdenPago, procesarWebhookPago } from '../controllers/payment.controller';

const paymentRouter = Router();

paymentRouter.get('/orders/:id', obtenerOrdenPago);
paymentRouter.post('/webhook', procesarWebhookPago);

export default paymentRouter;