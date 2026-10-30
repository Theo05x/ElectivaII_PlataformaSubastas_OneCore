import "dotenv/config"

import express, { Application } from 'express'
import { createAuthController } from './application/controllers/auth.controller'
import { createAuctionController } from './application/controllers/auction.controller'
import { createNotificationController } from './application/controllers/notification.controller'
import { createPaymentController } from './application/controllers/payment.controller'
import { createAuthenticateToken } from './application/middlewares/authentication.middleware'
import { createApiRouter } from './application/routes/index'
import { requestLogger } from './application/middlewares/logger.middleware'
import { errorHandler } from './application/middlewares/errorHandler.middleware'
import { notFound } from './application/middlewares/notFound.middleware'

import { connectDB } from './infraestructure/db/connection'
import { validateJwtConfiguration } from './infraestructure/jwt/jwt.service'
import {
    auctionService,
    authService,
    notificationService,
    paymentService,
    profileService,
    tokenService,
} from './infraestructure/services'
import { createServer } from 'node:http'
import { startAuctionWebSocket } from './infraestructure/websocket/auction-websocket'

const apiRouter = createApiRouter({
    auth: createAuthController(authService, profileService),
    auction: createAuctionController(auctionService),
    notification: createNotificationController(notificationService),
    payment: createPaymentController(paymentService),
    authenticateToken: createAuthenticateToken(tokenService),
});

const app : Application = express();
const server = createServer(app);
const PORT = process.env.PORT || 3000;

app.use('/api/v1/payment-events', express.raw({ type: 'application/json' }));
app.use(express.json());
app.use(requestLogger);

app.use('/api/v1', apiRouter);

app.use(notFound);
app.use(errorHandler);

const start = async (): Promise<void> => {
    validateJwtConfiguration();
    await connectDB();
    startAuctionWebSocket(server);
    server.listen(PORT, () => {
        console.log(`SERVER RUNNING AT ${PORT}`);
        console.log(`SOCKET.IO READY AT http://localhost:${PORT} (path /socket.io)`);
    });
};

void start().catch((error: unknown) => {
    console.error('No fue posible iniciar la aplicación:', error);
    process.exitCode = 1;
});
