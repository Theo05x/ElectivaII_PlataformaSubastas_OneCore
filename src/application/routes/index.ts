import { Router } from 'express';
import authRouter from './auth.router';
import auctionRouter from './auction.router';
import paymentRouter from '../src/application/routes/paymentRouter';
import notificationRouter from './notification.router';

const apiRouter = Router();

// Endpoint básico de salud del sistema
apiRouter.get('/health', (request, response) => {
  response.json({ status: "success", message: "API v1 de OneCore operativa" });
});

// Unificar todos los módulos
apiRouter.use('/auth', authRouter);
apiRouter.use('/auctions', auctionRouter);
apiRouter.use('/payments', paymentRouter);
apiRouter.use('/notifications', notificationRouter);

export default apiRouter;