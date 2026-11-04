import assert from "node:assert/strict";
import test from "node:test";
import type {
  AuctionRepository,
  AuctionEventPublisher,
  BidRepository,
  NotificationRepository,
  PaymentRepository,
} from "../src/domain/ports/repository-ports";
import type {
  Notification,
  RejectedBid,
} from "../src/domain/models/domain-types";
import { AuctionService } from "../src/domain/services/auction.service";
import { ServiceError } from "../src/domain/services/service-error";
import { AuctionStatus, Money } from "../src/domain/models/value-objects";
import { makeAuction, makeBid, makePaymentOrder } from "./fixtures";

test("registra pujas válidas, publica eventos y guarda intentos rechazados", async () => {
  const auction = makeAuction();
  const savedBids: ReturnType<typeof makeBid>[] = [];
  const rejectedBids: RejectedBid[] = [];
  const notifications: Notification[] = [];
  const events: Array<{
    event: string;
    payload: Record<string, string | number | null>;
  }> = [];
  const auctionRepository: AuctionRepository = {
    create: async () => auction,
    findById: async () => auction,
    findCategories: async () => [],
    findBySeller: async () => [],
    findByIds: async () => [],
    findMany: async () => [],
    save: async (value) => value,
  };
  const bidRepository: BidRepository = {
    create: async (auctionId, bidderId, amount) => {
      const bid = makeBid({ auctionId, bidderId, amount });
      savedBids.push(bid);
      return bid;
    },
    findByAuction: async () => savedBids,
    findByBidder: async () => savedBids,
    createRejected: async (bid) => {
      rejectedBids.push(bid);
    },
    findRejectedByAuction: async () => rejectedBids,
  };
  const paymentRepository: PaymentRepository = {
    findOrderById: async () => null,
    findOrderByAuction: async () => null,
    createOrder: async () => {
      throw new Error("No debe crear una orden en esta prueba.");
    },
    saveOrder: async (order) => order,
    recordEvent: async () => true,
  };
  const notificationRepository: NotificationRepository = {
    create: async (notification) => {
      notifications.push(notification);
    },
    findByUser: async () => notifications,
  };
  const eventPublisher: AuctionEventPublisher = {
    publish: (_auctionId, event, payload) => {
      events.push({ event, payload });
    },
  };
  const service = new AuctionService(
    auctionRepository,
    bidRepository,
    paymentRepository,
    notificationRepository,
    eventPublisher,
  );

  const firstBid = await service.placeBid(auction.id, "bidder-1", 100);
  assert.equal(firstBid.amount.amount, 100);
  assert.equal(auction.currentBidderId, "bidder-1");
  assert.equal(events[0]?.event, "bid.accepted");

  const secondBid = await service.placeBid(auction.id, "bidder-2", 110);
  assert.equal(secondBid.amount.amount, 110);
  assert.equal(auction.currentBidderId, "bidder-2");
  assert.ok(
    notifications.some(
      (item) => item.userId === "bidder-1" && item.type === "BID_OUTBID",
    ),
  );
  assert.ok(events.some((item) => item.event === "bid.outbid"));

  await assert.rejects(service.placeBid(auction.id, "bidder-2", 120), {
    code: "SELF_OUTBID",
  });
  assert.equal(savedBids.length, 2);
  assert.equal(rejectedBids.length, 1);
  assert.equal(rejectedBids[0]?.amount, 120);
});

test("guarda como cero los importes inválidos que no son finitos", async () => {
  const auction = makeAuction();
  let rejectedAmount: number | undefined;
  const auctionRepository: AuctionRepository = {
    create: async () => auction,
    findById: async () => auction,
    findCategories: async () => [],
    findBySeller: async () => [],
    findByIds: async () => [],
    findMany: async () => [],
    save: async (value) => value,
  };
  const bidRepository: BidRepository = {
    create: async () => makeBid(),
    findByAuction: async () => [],
    findByBidder: async () => [],
    createRejected: async (bid) => {
      rejectedAmount = bid.amount;
    },
    findRejectedByAuction: async () => [],
  };
  const paymentRepository: PaymentRepository = {
    findOrderById: async () => null,
    findOrderByAuction: async () => null,
    createOrder: async () => {
      throw new Error("No debe crear una orden en esta prueba.");
    },
    saveOrder: async (order) => order,
    recordEvent: async () => true,
  };
  const notificationRepository: NotificationRepository = {
    create: async () => undefined,
    findByUser: async () => [],
  };
  const service = new AuctionService(
    auctionRepository,
    bidRepository,
    paymentRepository,
    notificationRepository,
    null,
  );

  await assert.rejects(service.placeBid(auction.id, "bidder-1", Number.NaN), {
    code: "INVALID_MONEY",
  });
  assert.equal(rejectedAmount, 0);
});

test("cierra una subasta vencida, crea una orden de 48 horas y notifica al ganador y al vendedor", async () => {
  const auction = makeAuction({
    endDate: new Date(Date.now() - 1000),
    currentBidderId: "winner-1",
    currentBidAmount: Money.create(150),
  });
  const notifications: Notification[] = [];
  const savedAuctions: ReturnType<typeof makeAuction>[] = [];
  const createdOrders: ReturnType<typeof makePaymentOrder>[] = [];
  const auctionRepository: AuctionRepository = {
    create: async () => auction,
    findById: async () => auction,
    findCategories: async () => [],
    findBySeller: async () => [],
    findByIds: async () => [],
    findMany: async () => [],
    save: async (value) => {
      savedAuctions.push(value);
      return value;
    },
  };
  const bidRepository: BidRepository = {
    create: async () => makeBid(),
    findByAuction: async () => [],
    findByBidder: async () => [],
    createRejected: async () => undefined,
    findRejectedByAuction: async () => [],
  };
  const paymentRepository: PaymentRepository = {
    findOrderById: async () => null,
    findOrderByAuction: async () => null,
    createOrder: async (input) => {
      const order = makePaymentOrder({ ...input, id: "order-1" });
      createdOrders.push(order);
      return order;
    },
    saveOrder: async (order) => order,
    recordEvent: async () => true,
  };
  const notificationRepository: NotificationRepository = {
    create: async (notification) => {
      notifications.push(notification);
    },
    findByUser: async () => notifications,
  };
  const service = new AuctionService(
    auctionRepository,
    bidRepository,
    paymentRepository,
    notificationRepository,
    null,
  );

  const result = await service.get(auction.id);
  await service.get(auction.id);

  assert.equal(result.status, AuctionStatus.CLOSED);
  assert.equal(result.winnerId, "winner-1");
  assert.equal(createdOrders.length, 1);
  assert.equal(notifications.length, 2);
  assert.equal(createdOrders[0]?.amount.amount, 150);
  assert.ok(
    (createdOrders[0]?.expirationDate.getTime() ?? 0) - Date.now() >=
      47 * 60 * 60 * 1000,
  );
  assert.ok(savedAuctions.includes(auction));
  assert.ok(
    notifications.some(
      (item) => item.userId === "winner-1" && item.type === "AUCTION_WON",
    ),
  );
  assert.ok(
    notifications.some(
      (item) => item.userId === "seller-1" && item.type === "AUCTION_CLOSED",
    ),
  );
});

test("rechaza paginación fuera de rango e informa cuando no existe la subasta", async () => {
  const auctionRepository: AuctionRepository = {
    create: async () => makeAuction(),
    findById: async () => null,
    findCategories: async () => [],
    findBySeller: async () => [],
    findByIds: async () => [],
    findMany: async () => [],
    save: async (value) => value,
  };
  const bidRepository: BidRepository = {
    create: async () => makeBid(),
    findByAuction: async () => [],
    findByBidder: async () => [],
    createRejected: async () => undefined,
    findRejectedByAuction: async () => [],
  };
  const paymentRepository: PaymentRepository = {
    findOrderById: async () => null,
    findOrderByAuction: async () => null,
    createOrder: async (input) => makePaymentOrder({ ...input, id: "order-1" }),
    saveOrder: async (order) => order,
    recordEvent: async () => true,
  };
  const notificationRepository: NotificationRepository = {
    create: async () => undefined,
    findByUser: async () => [],
  };
  const service = new AuctionService(
    auctionRepository,
    bidRepository,
    paymentRepository,
    notificationRepository,
    null,
  );

  await assert.rejects(service.list({ skip: 0, limit: 101 }), {
    code: "INVALID_PAGINATION",
  });
  await assert.rejects(service.get("missing"), (error: unknown) => {
    assert.ok(error instanceof ServiceError);
    assert.equal(error.statusCode, 404);
    assert.equal(error.code, "AUCTION_NOT_FOUND");
    return true;
  });
});
