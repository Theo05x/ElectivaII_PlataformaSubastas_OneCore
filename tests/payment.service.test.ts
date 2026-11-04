import assert from "node:assert/strict";
import test from "node:test";
import type {
  AuctionRepository,
  NotificationRepository,
  PaymentRepository,
  PaymentSignatureVerifier,
} from "../src/domain/ports/repository-ports";
import type { Notification } from "../src/domain/models/domain-types";
import { PaymentService } from "../src/domain/services/payment.service";
import {
  AuctionStatus,
  PaymentOrderStatus,
} from "../src/domain/models/value-objects";
import { makeAuction, makePaymentOrder } from "./fixtures";

test("el aviso de pago aprobado marca la orden y la subasta como pagadas y notifica a ambas partes", async () => {
  const order = makePaymentOrder();
  const auction = makeAuction({ status: AuctionStatus.CLOSED });
  const notifications: Notification[] = [];
  const recordedEvents = new Set<string>();
  const paymentRepository: PaymentRepository = {
    findOrderById: async (id) => (id === order.id ? order : null),
    findOrderByAuction: async () => order,
    createOrder: async (input) => ({ ...order, ...input }),
    saveOrder: async (value) => value,
    recordEvent: async (event) => {
      if (recordedEvents.has(event.providerEventId)) return false;
      recordedEvents.add(event.providerEventId);
      return true;
    },
  };
  const auctionRepository: AuctionRepository = {
    create: async () => auction,
    findById: async (id) => (id === auction.id ? auction : null),
    findCategories: async () => [],
    findBySeller: async () => [],
    findByIds: async () => [],
    findMany: async () => [],
    save: async (value) => value,
  };
  const notificationRepository: NotificationRepository = {
    create: async (notification) => {
      notifications.push(notification);
    },
    findByUser: async () => notifications,
  };
  const verifier: PaymentSignatureVerifier = { verify: () => true };
  const service = new PaymentService(
    paymentRepository,
    auctionRepository,
    notificationRepository,
    verifier,
  );
  const payload = JSON.stringify({
    providerEventId: "provider-event-1",
    orderId: order.id,
    transactionId: "transaction-1",
    result: "APPROVED",
  });

  assert.deepEqual(await service.receiveWebhook(payload, "signature"), {
    received: true,
    duplicate: false,
  });
  assert.equal(order.status, PaymentOrderStatus.PAID);
  assert.equal(order.transactionId, "transaction-1");
  assert.equal(auction.status, AuctionStatus.PAID);
  assert.equal(notifications.length, 2);
  assert.ok(notifications.some((item) => item.userId === order.winnerId));
  assert.ok(notifications.some((item) => item.userId === "seller-1"));

  assert.deepEqual(await service.receiveWebhook(payload, "signature"), {
    received: true,
    duplicate: true,
  });
  assert.equal(notifications.length, 2);
});

test("rechaza avisos de pago sin configuración, con firma inválida o contenido mal formado", async () => {
  const order = makePaymentOrder();
  const paymentRepository: PaymentRepository = {
    findOrderById: async () => order,
    findOrderByAuction: async () => order,
    createOrder: async (input) => ({ ...order, ...input }),
    saveOrder: async (value) => value,
    recordEvent: async () => true,
  };
  const auctionRepository: AuctionRepository = {
    create: async () => makeAuction(),
    findById: async () => null,
    findCategories: async () => [],
    findBySeller: async () => [],
    findByIds: async () => [],
    findMany: async () => [],
    save: async (value) => value,
  };
  const notificationRepository: NotificationRepository = {
    create: async () => undefined,
    findByUser: async () => [],
  };

  const unconfigured = new PaymentService(
    paymentRepository,
    auctionRepository,
    notificationRepository,
    null,
  );
  await assert.rejects(unconfigured.receiveWebhook("{}", ""), {
    code: "WEBHOOK_NOT_CONFIGURED",
  });

  const invalidSignature = new PaymentService(
    paymentRepository,
    auctionRepository,
    notificationRepository,
    { verify: () => false },
  );
  await assert.rejects(invalidSignature.receiveWebhook("{}", "invalid"), {
    code: "INVALID_WEBHOOK_SIGNATURE",
  });

  const validSignature = new PaymentService(
    paymentRepository,
    auctionRepository,
    notificationRepository,
    { verify: () => true },
  );
  await assert.rejects(validSignature.receiveWebhook("not-json", "valid"), {
    code: "INVALID_WEBHOOK_PAYLOAD",
  });
  await assert.rejects(validSignature.receiveWebhook("{}", "valid"), {
    code: "INVALID_WEBHOOK_PAYLOAD",
  });
});

test("solo el ganador consulta la orden y su vencimiento marca el incumplimiento de la subasta", async () => {
  const order = makePaymentOrder({
    expirationDate: new Date(Date.now() - 1000),
  });
  const auction = makeAuction({ status: AuctionStatus.CLOSED });
  const notifications: Notification[] = [];
  let savedOrder = false;
  const paymentRepository: PaymentRepository = {
    findOrderById: async () => order,
    findOrderByAuction: async () => order,
    createOrder: async (input) => ({ ...order, ...input }),
    saveOrder: async (value) => {
      savedOrder = true;
      return value;
    },
    recordEvent: async () => true,
  };
  const auctionRepository: AuctionRepository = {
    create: async () => auction,
    findById: async () => auction,
    findCategories: async () => [],
    findBySeller: async () => [],
    findByIds: async () => [],
    findMany: async () => [],
    save: async (value) => value,
  };
  const notificationRepository: NotificationRepository = {
    create: async (notification) => {
      notifications.push(notification);
    },
    findByUser: async () => notifications,
  };
  const service = new PaymentService(
    paymentRepository,
    auctionRepository,
    notificationRepository,
    { verify: () => true },
  );

  await assert.rejects(service.getOrder(order.id, "other-user"), {
    code: "NOT_ORDER_OWNER",
  });
  assert.equal(savedOrder, false);

  const result = await service.getOrder(order.id, order.winnerId);
  assert.equal(result.status, PaymentOrderStatus.EXPIRED);
  assert.equal(auction.status, AuctionStatus.DEFAULTED);
  assert.equal(savedOrder, true);
  assert.equal(notifications[0]?.type, "PAYMENT_EXPIRED");
});
