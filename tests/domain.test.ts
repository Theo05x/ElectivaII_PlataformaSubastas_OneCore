import assert from "node:assert/strict";
import test from "node:test";
import {
  applyBid,
  cancelAuction,
  closeAuction,
  DomainRuleError,
  validateBid,
  validateNewAuction,
} from "../src/domain/models/auction-rules";
import { AuctionStatus, Money } from "../src/domain/models/value-objects";
import { makeAuction } from "./fixtures";

test("acepta los datos requeridos y una duración de una hora para la subasta", () => {
  const now = Date.now();
  const auction = {
    sellerId: "seller-1",
    article: {
      title: "Artículo",
      description: "Descripción",
      conservationState: "Bueno",
    },
    category: "General",
    basePrice: Money.create(100),
    minimumIncrement: Money.create(10),
    endDate: new Date(now + 60 * 60 * 1000),
  };

  assert.doesNotThrow(() => validateNewAuction(auction, now));
});

test("rechaza un precio inválido y fechas fuera del intervalo permitido", () => {
  const now = Date.now();
  const auction = {
    sellerId: "seller-1",
    article: {
      title: "Artículo",
      description: "Descripción",
      conservationState: "Bueno",
    },
    category: "General",
    basePrice: Money.create(0),
    minimumIncrement: Money.create(10),
    endDate: new Date(now + 60 * 60 * 1000),
  };

  assert.throws(() => validateNewAuction(auction, now), {
    code: "INVALID_BASE_PRICE",
  });
  assert.throws(
    () =>
      validateNewAuction(
        {
          ...auction,
          basePrice: Money.create(100),
          endDate: new Date(now + 30 * 60 * 1000),
        },
        now,
      ),
    { code: "INVALID_AUCTION_DURATION" },
  );
  assert.throws(
    () =>
      validateNewAuction(
        {
          ...auction,
          basePrice: Money.create(100),
          endDate: new Date(now + 31 * 24 * 60 * 60 * 1000),
        },
        now,
      ),
    { code: "INVALID_AUCTION_DURATION" },
  );
});

test("valida precio, incremento, propietario, estado abierto y fecha límite de la puja", () => {
  const now = Date.now();
  const auction = makeAuction({
    currentBidAmount: Money.create(100),
    currentBidderId: "bidder-1",
  });

  assert.throws(
    () => validateBid(auction, "bidder-2", Money.create(109), now),
    { code: "INSUFFICIENT_INCREMENT" },
  );
  assert.throws(
    () => validateBid(auction, "bidder-1", Money.create(110), now),
    { code: "SELF_OUTBID" },
  );
  assert.throws(
    () => validateBid(auction, "seller-1", Money.create(110), now),
    { code: "SELLER_CANNOT_BID" },
  );
  assert.throws(
    () => validateBid(makeAuction(), "bidder-2", Money.create(99), now),
    { code: "BELOW_BASE_PRICE" },
  );
  assert.throws(
    () =>
      validateBid(
        makeAuction({ status: AuctionStatus.CLOSED }),
        "bidder-2",
        Money.create(110),
        now,
      ),
    { code: "AUCTION_NOT_OPEN" },
  );
  assert.throws(
    () =>
      validateBid(
        makeAuction({ endDate: new Date(now - 1) }),
        "bidder-2",
        Money.create(110),
        now,
      ),
    { code: "AUCTION_EXPIRED" },
  );
});

test("actualiza la puja más alta y devuelve al postor anterior", () => {
  const auction = makeAuction({
    currentBidAmount: Money.create(100),
    currentBidderId: "bidder-1",
  });

  assert.equal(applyBid(auction, "bidder-2", Money.create(110)), "bidder-1");
  assert.equal(auction.currentBidderId, "bidder-2");
  assert.equal(auction.currentBidAmount?.amount, 110);
});

test("solo permite al vendedor cancelar una subasta abierta y sin pujas", () => {
  const auction = makeAuction();
  cancelAuction(auction, "seller-1");
  assert.equal(auction.status, AuctionStatus.CANCELLED);

  assert.throws(() => cancelAuction(makeAuction(), "someone-else"), {
    code: "NOT_AUCTION_OWNER",
  });
  assert.throws(
    () =>
      cancelAuction(
        makeAuction({
          currentBidderId: "bidder-1",
          currentBidAmount: Money.create(100),
        }),
        "seller-1",
      ),
    { code: "AUCTION_HAS_BIDS" },
  );
});

test("mantiene abiertas las subastas vigentes y cierra las vencidas como desiertas o adjudicadas", () => {
  const now = Date.now();
  const future = makeAuction({ endDate: new Date(now + 1000) });
  assert.equal(closeAuction(future, now), "NOT_DUE");
  assert.equal(future.status, AuctionStatus.OPEN);

  const deserted = makeAuction({ endDate: new Date(now - 1) });
  assert.equal(closeAuction(deserted, now), "DESERTED");
  assert.equal(deserted.status, AuctionStatus.DESIERTA);

  const awarded = makeAuction({
    endDate: new Date(now - 1),
    currentBidderId: "winner-1",
    currentBidAmount: Money.create(130),
  });
  assert.equal(closeAuction(awarded, now), "AWARDED");
  assert.equal(awarded.status, AuctionStatus.CLOSED);
  assert.equal(awarded.winnerId, "winner-1");
  assert.equal(awarded.winningBidAmount?.amount, 130);
});

test("rechaza montos negativos o que no sean enteros", () => {
  assert.throws(() => Money.create(-1), { code: "INVALID_MONEY" });
  assert.throws(() => Money.create(1.5), { code: "INVALID_MONEY" });
});

test("representa los errores de reglas de negocio con código y estado HTTP", () => {
  const error = new DomainRuleError("RULE", "Regla", 409);

  assert.equal(error.code, "RULE");
  assert.equal(error.statusCode, 409);
});
