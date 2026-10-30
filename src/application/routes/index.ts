import { RequestHandler, Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { AuctionController } from '../controllers/auction.controller';
import { NotificationController } from '../controllers/notification.controller';
import { PaymentController } from '../controllers/payment.controller';
import { createAuctionRouter } from './auction.router';
import { createNotificationRouter } from './notification.router';
import { createPaymentEventsRouter } from './payment-events.router';
import { createPaymentRouter } from './payment.router';
import { createSessionsRouter } from './sessions.router';
import { createUsersRouter } from './users.router';

export interface ApiControllers {
  auth: AuthController;
  auction: AuctionController;
  notification: NotificationController;
  payment: PaymentController;
  authenticateToken: RequestHandler;
}

export const createApiRouter = (controllers: ApiControllers) => {
  const apiRouter = Router();

// Endpoint básico de salud del sistema
  apiRouter.get('/health', (_request, response) => {
    response.json({ status: 'success', message: 'API v1 de OneCore operativa' });
  });

// Unificar todos los módulos
  apiRouter.use(
    '/users',
    createUsersRouter(controllers.auth, controllers.authenticateToken)
  );
  apiRouter.use('/sessions', createSessionsRouter(controllers.auth));
  apiRouter.use(
    '/auctions',
    createAuctionRouter(controllers.auction, controllers.authenticateToken)
  );
  apiRouter.use(
    '/payment-orders',
    createPaymentRouter(controllers.payment, controllers.authenticateToken)
  );
  apiRouter.use('/payment-events', createPaymentEventsRouter(controllers.payment));
  apiRouter.use(
    '/notifications',
    createNotificationRouter(
      controllers.notification,
      controllers.authenticateToken
    )
  );

  return apiRouter;
};