import { RequestHandler, Router } from 'express';
import { NotificationController } from '../controllers/notification.controller';

export const createNotificationRouter = (
  controller: NotificationController,
  authenticateToken: RequestHandler
) => {
  const notificationRouter = Router();

  notificationRouter.get('/', authenticateToken, controller.listarNotificaciones);

  return notificationRouter;
};