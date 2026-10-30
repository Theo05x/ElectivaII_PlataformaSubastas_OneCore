import { NotificationRepository } from '../ports/repository-ports';

export class NotificationService {
  constructor(private readonly notifications: NotificationRepository) {}

  listForUser(userId: string) {
    return this.notifications.findByUser(userId);
  }
}
