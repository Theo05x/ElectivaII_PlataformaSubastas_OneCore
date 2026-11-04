import assert from "node:assert/strict";
import { createServer } from "node:http";
import test from "node:test";
import { io, Socket } from "socket.io-client";
import type {
  AuctionRepository,
  BidRepository,
  NotificationRepository,
  PaymentRepository,
} from "../src/domain/ports/repository-ports";
import { AuctionService } from "../src/domain/services/auction.service";
import {
  createAuctionWebSocket,
  AuctionWebSocketInstance,
} from "../src/infraestructure/websocket/auction-websocket";
import { makeAuction, makeBid } from "./fixtures";

const auctionId = "507f1f77bcf86cd799439011";
const eventTimeoutMs = 3000;

const waitForEvent = <T>(socket: Socket, event: string): Promise<T> =>
  new Promise((resolve, reject) => {
    const timeout = setTimeout(
      () => reject(new Error(`Tiempo agotado esperando el evento "${event}".`)),
      eventTimeoutMs,
    );
    socket.once(event, (payload: T) => {
      clearTimeout(timeout);
      resolve(payload);
    });
  });

const listen = (server: ReturnType<typeof createServer>): Promise<number> =>
  new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") {
        reject(new Error("No se pudo determinar el puerto de pruebas."));
        return;
      }
      resolve(address.port);
    });
  });

interface SocketEvent {
  auctionId: string;
  data: Record<string, string | number | null>;
}

interface ParticipantUpdate {
  auctionId: string;
  data: { count: number };
}

test("dos usuarios autenticados reciben las pujas en tiempo real y solo se avisa al postor superado", async (t) => {
  const auction = makeAuction({ id: auctionId });
  const httpServer = createServer();
  const auctionRepository: AuctionRepository = {
    create: async () => auction,
    findById: async (id) => (id === auctionId ? auction : null),
    findCategories: async () => [],
    findBySeller: async () => [],
    findByIds: async () => [],
    findMany: async () => [],
    save: async (value) => value,
  };
  const websocket: AuctionWebSocketInstance = createAuctionWebSocket(
    httpServer,
    {
      auctions: auctionRepository,
      verifyUserToken(token) {
        if (token === "token-user-1") return "user-1";
        if (token === "token-user-2") return "user-2";
        throw new Error("Token inválido.");
      },
    },
  );
  const sockets: Socket[] = [];

  t.after(async () => {
    for (const socket of sockets) socket.disconnect();
    await websocket.close();
  });

  const port = await listen(httpServer);
  const socketUrl = `http://127.0.0.1:${port}`;

  const connectAndAuthenticate = async (token: string): Promise<Socket> => {
    const socket = io(socketUrl, {
      path: "/socket.io",
      transports: ["websocket"],
      reconnection: false,
    });
    sockets.push(socket);

    const connected = waitForEvent<{ message: string }>(socket, "connected");
    await connected;
    const authenticated = waitForEvent<void>(socket, "authenticated");
    socket.emit("authenticate", { token });
    await authenticated;
    return socket;
  };

  const [user1, user2] = await Promise.all([
    connectAndAuthenticate("token-user-1"),
    connectAndAuthenticate("token-user-2"),
  ]);

  const user1Subscribed = waitForEvent<{
    auctionId: string;
    participantCount: number;
  }>(user1, "subscribed");
  const user1FirstCount = waitForEvent<ParticipantUpdate>(
    user1,
    "participants.updated",
  );
  user1.emit("subscribe", { auctionId });
  assert.equal((await user1Subscribed).participantCount, 1);
  assert.equal((await user1FirstCount).data.count, 1);

  const user2Subscribed = waitForEvent<{
    auctionId: string;
    participantCount: number;
  }>(user2, "subscribed");
  const user1SecondCount = waitForEvent<ParticipantUpdate>(
    user1,
    "participants.updated",
  );
  const user2SecondCount = waitForEvent<ParticipantUpdate>(
    user2,
    "participants.updated",
  );
  user2.emit("subscribe", { auctionId });

  assert.equal((await user2Subscribed).participantCount, 2);
  assert.equal((await user1SecondCount).data.count, 2);
  assert.equal((await user2SecondCount).data.count, 2);

  const bids: Array<{ bidderId: string; amount: number }> = [];
  const auctionService = new AuctionService(
    auctionRepository,
    {
      create: async (id, bidderId, amount) => {
        const bid = makeBid({
          id: `bid-${bids.length + 1}`,
          auctionId: id,
          bidderId,
          amount,
        });
        bids.push({ bidderId, amount: amount.amount });
        return bid;
      },
      findByAuction: async () => [],
      findByBidder: async () => [],
      createRejected: async () => undefined,
      findRejectedByAuction: async () => [],
    } satisfies BidRepository,
    {
      findOrderById: async () => null,
      findOrderByAuction: async () => null,
      createOrder: async () => {
        throw new Error("No debe crear una orden en esta prueba.");
      },
      saveOrder: async (order) => order,
      recordEvent: async () => true,
    } satisfies PaymentRepository,
    {
      create: async () => undefined,
      findByUser: async () => [],
    } satisfies NotificationRepository,
    websocket.publisher,
  );

  const firstBidForUser1 = waitForEvent<SocketEvent>(user1, "bid.accepted");
  const firstBidForUser2 = waitForEvent<SocketEvent>(user2, "bid.accepted");
  await auctionService.placeBid(auctionId, "user-1", 100);
  assert.equal((await firstBidForUser1).data.amount, 100);
  assert.equal((await firstBidForUser2).data.amount, 100);

  const secondBidForUser1 = waitForEvent<SocketEvent>(user1, "bid.accepted");
  const secondBidForUser2 = waitForEvent<SocketEvent>(user2, "bid.accepted");
  const outbidForUser1 = waitForEvent<SocketEvent>(user1, "bid.outbid");
  let user2ReceivedOutbid = false;
  const recordUnexpectedOutbid = (): void => {
    user2ReceivedOutbid = true;
  };
  user2.on("bid.outbid", recordUnexpectedOutbid);

  await auctionService.placeBid(auctionId, "user-2", 110);

  assert.equal((await secondBidForUser1).data.amount, 110);
  assert.equal((await secondBidForUser2).data.amount, 110);
  assert.equal((await outbidForUser1).data.bidderId, "user-1");
  await new Promise((resolve) => setTimeout(resolve, 50));
  user2.off("bid.outbid", recordUnexpectedOutbid);

  assert.equal(user2ReceivedOutbid, false);
  assert.deepEqual(bids, [
    { bidderId: "user-1", amount: 100 },
    { bidderId: "user-2", amount: 110 },
  ]);
});
