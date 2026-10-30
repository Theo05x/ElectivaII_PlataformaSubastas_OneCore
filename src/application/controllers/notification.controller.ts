import { Request, Response } from 'express';
import { NotificationService } from '../../domain/services/notification.service';
import { requireUserId } from './request-data';

export const createNotificationController = (
  notificationService: NotificationService
) => ({
  listarNotificaciones: async (request: Request, response: Response) => {
    const notifications = await notificationService.listForUser(
      requireUserId(request)
    );
    response.status(200).json({ status: 'success', data: notifications });
  },
});

export type NotificationController = ReturnType<
  typeof createNotificationController
>;
