import { Router } from 'express';
import authRouter from './authRouter';
import auctionRouter from './auctionRouter';
import paymentRouter from './paymentRouter';
import notificationRouter from './notificationRouter';

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