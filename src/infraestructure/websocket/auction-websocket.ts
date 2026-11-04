import { Server as HttpServer } from 'node:http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { isValidObjectId } from 'mongoose';
import {
  AuctionEventPublisher,
  AuctionRepository,
} from '../../domain/ports/repository-ports';
import { mongoAuctionRepository } from '../db/repositories/repository-adapters';
import { verifyToken } from '../jwt/jwt.service';

interface Client {
  userId: string | null;
  auctions: Set<string>;
}

export interface AuctionWebSocketDependencies {
  auctions: Pick<AuctionRepository, 'findById'>;
  verifyUserToken(token: string): string;
}

export interface AuctionWebSocketInstance {
  publisher: AuctionEventPublisher;
  close(): Promise<void>;
}

export const createAuctionWebSocket = (
  server: HttpServer,
  dependencies: AuctionWebSocketDependencies
): AuctionWebSocketInstance => {
  const clients = new Map<Socket, Client>();
  const socketIoServer = new SocketIOServer(server, { path: '/socket.io' });

  const sendError = (socket: Socket, message: string): void => {
    socket.emit('error', { message });
  };

  const participantCount = (auctionId: string): number => {
    const users = new Set<string>();
    for (const client of clients.values()) {
      if (client.userId && client.auctions.has(auctionId)) {
        users.add(client.userId);
      }
    }
    return users.size;
  };

  const publishToAuction = (
    auctionId: string,
    event: string,
    data: Record<string, string | number | null>
  ): void => {
    for (const [socket, client] of clients) {
      if (client.auctions.has(auctionId)) {
        socket.emit(event, { auctionId, data });
      }
    }
  };

  const publishParticipantCount = (auctionId: string): void => {
    publishToAuction(auctionId, 'participants.updated', {
      count: participantCount(auctionId),
    });
  };

  const publisher: AuctionEventPublisher = {
    publish(auctionId, event, payload) {
      if (event === 'bid.outbid' && typeof payload.bidderId === 'string') {
        for (const [socket, client] of clients) {
          if (client.userId === payload.bidderId) {
            socket.emit(event, { auctionId, data: payload });
          }
        }
        return;
      }

      publishToAuction(auctionId, event, payload);
    },
  };

  const authenticateClient = (socket: Socket, payload: unknown): void => {
    const client = clients.get(socket);
    if (!client) return;

    if (client.userId) {
      sendError(socket, 'La conexión ya está autenticada.');
      return;
    }

    if (
      typeof payload !== 'object' ||
      payload === null ||
      !('token' in payload) ||
      typeof payload.token !== 'string'
    ) {
      sendError(socket, 'Se requiere un token JWT.');
      return;
    }

    try {
      client.userId = dependencies.verifyUserToken(payload.token);
      if (!client.userId) {
        socket.disconnect(true);
        return;
      }
      socket.emit('authenticated');
    } catch {
      socket.disconnect(true);
    }
  };

  const subscribeToAuction = async (
    socket: Socket,
    payload: unknown
  ): Promise<void> => {
    const client = clients.get(socket);
    if (!client) return;

    if (!client.userId) {
      sendError(socket, 'Autentícate antes de suscribirte.');
      return;
    }

    if (
      typeof payload !== 'object' ||
      payload === null ||
      !('auctionId' in payload) ||
      typeof payload.auctionId !== 'string'
    ) {
      sendError(socket, 'Se requiere un identificador de subasta.');
      return;
    }

    const auctionId = payload.auctionId;
    if (!isValidObjectId(auctionId)) {
      sendError(socket, 'El identificador de subasta no es válido.');
      return;
    }

    const auction = await dependencies.auctions.findById(auctionId);
    if (clients.get(socket) !== client || !socket.connected) return;
    if (!auction) {
      sendError(socket, 'La subasta no existe.');
      return;
    }

    const previousCount = participantCount(auctionId);
    client.auctions.add(auctionId);
    socket.emit('subscribed', {
      auctionId,
      participantCount: participantCount(auctionId),
    });
    if (participantCount(auctionId) !== previousCount) {
      publishParticipantCount(auctionId);
    }
  };

  const unsubscribeFromAuction = (socket: Socket, payload: unknown): void => {
    const client = clients.get(socket);
    if (!client) return;

    if (!client.userId) {
      sendError(socket, 'Autentícate antes de suscribirte.');
      return;
    }

    if (
      typeof payload !== 'object' ||
      payload === null ||
      !('auctionId' in payload) ||
      typeof payload.auctionId !== 'string'
    ) {
      sendError(socket, 'Se requiere un identificador de subasta.');
      return;
    }

    const auctionId = payload.auctionId;
    const previousCount = participantCount(auctionId);
    client.auctions.delete(auctionId);
    socket.emit('unsubscribed', { auctionId });
    if (participantCount(auctionId) !== previousCount) {
      publishParticipantCount(auctionId);
    }
  };

  socketIoServer.engine.on('connection_error', error => {
    console.error('Error en conexión Socket.IO:', error.message);
  });

  socketIoServer.on('connection', socket => {
    clients.set(socket, { userId: null, auctions: new Set<string>() });
    socket.emit('connected', {
      message: 'Envía el evento authenticate con tu token JWT.',
    });

    socket.on('authenticate', payload => authenticateClient(socket, payload));
    socket.on('subscribe', payload => {
      void subscribeToAuction(socket, payload).catch(error => {
        console.error('Error procesando suscripción Socket.IO:', error);
        sendError(socket, 'No fue posible suscribirse a la subasta.');
      });
    });
    socket.on('unsubscribe', payload => unsubscribeFromAuction(socket, payload));

    socket.on('disconnect', () => {
      const client = clients.get(socket);
      if (!client) return;
      const previousCounts = new Map(
        [...client.auctions].map(auctionId => [
          auctionId,
          participantCount(auctionId),
        ])
      );
      clients.delete(socket);
      for (const auctionId of client.auctions) {
        if (participantCount(auctionId) !== previousCounts.get(auctionId)) {
          publishParticipantCount(auctionId);
        }
      }
    });

    socket.on('error', error => {
      console.error('Error en conexión Socket.IO:', error);
    });
  });

  return {
    publisher,
    close: () =>
      new Promise<void>((resolve, reject) => {
        socketIoServer.close(error => {
          if (error) reject(error);
          else resolve();
        });
      }),
  };
};

let activeWebSocket: AuctionWebSocketInstance | null = null;

export const auctionEventPublisher: AuctionEventPublisher = {
  publish(auctionId, event, payload) {
    activeWebSocket?.publisher.publish(auctionId, event, payload);
  },
};

export const startAuctionWebSocket = (server: HttpServer): void => {
  if (activeWebSocket) throw new Error('El servidor Socket.IO ya fue iniciado.');

  activeWebSocket = createAuctionWebSocket(server, {
    auctions: mongoAuctionRepository,
    verifyUserToken(token) {
      const userId = verifyToken(token).sub;
      if (!userId) throw new Error('Token inválido.');
      return userId;
    },
  });
};
