import { AuthService } from '../domain/services/auth.service';
import { AuctionService } from '../domain/services/auction.service';
import { NotificationService } from '../domain/services/notification.service';
import { PaymentService } from '../domain/services/payment.service';
import { ProfileService } from '../domain/services/profile.service';
import { JwtTokenService } from './jwt/token.service';
import {
  mongoAuctionRepository,
  mongoBidRepository,
  mongoNotificationRepository,
  mongoPaymentRepository,
  mongoUserRepository,
} from './db/repositories/repository-adapters';
import { ScryptPasswordService } from './security/password.service';
import { HmacPaymentSignatureVerifier } from './security/payment-signature.service';
import { auctionEventPublisher } from './websocket/auction-websocket';

const passwordService = new ScryptPasswordService();
export const tokenService = new JwtTokenService();

export const authService = new AuthService(
  mongoUserRepository,
  passwordService,
  tokenService
);

export const auctionService = new AuctionService(
  mongoAuctionRepository,
  mongoBidRepository,
  mongoPaymentRepository,
  mongoNotificationRepository,
  auctionEventPublisher
);

export const profileService = new ProfileService(
  mongoUserRepository,
  mongoAuctionRepository,
  mongoBidRepository
);

export const paymentService = new PaymentService(
  mongoPaymentRepository,
  mongoAuctionRepository,
  mongoNotificationRepository,
  process.env.PAYMENT_WEBHOOK_SECRET
    ? new HmacPaymentSignatureVerifier(process.env.PAYMENT_WEBHOOK_SECRET)
    : null
);

export const notificationService = new NotificationService(
  mongoNotificationRepository
);
