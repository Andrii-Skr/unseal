import { afterAll, describe, expect, it } from "vitest";
import { DEFAULT_CARD } from "@/lib/card-schema";
import {
  cleanupStaleCardCreationQuotas,
  consumeCardCreationQuota,
  enforceCardCreationQuota,
} from "@/lib/card-rate-limit";
import { cleanupExpiredCards, readPublicCard } from "@/lib/cards";
import { prisma } from "@/lib/prisma";
import { createPublicToken, getCardExpiry } from "@/lib/tokens";

const createdIds: string[] = [];
const createdQuotaKeys: string[] = [];
const createdExpiredTokens: string[] = [];

afterAll(async () => {
  if (createdIds.length > 0) {
    await prisma.card.deleteMany({ where: { id: { in: createdIds } } });
  }
  if (createdQuotaKeys.length > 0) {
    await prisma.cardCreationQuota.deleteMany({
      where: { key: { in: createdQuotaKeys } },
    });
  }
  if (createdExpiredTokens.length > 0) {
    await prisma.expiredCardToken.deleteMany({
      where: { token: { in: createdExpiredTokens } },
    });
  }
  await prisma.$disconnect();
});

describe("card persistence", () => {
  it("round-trips an active card without exposing its internal id", async () => {
    const token = createPublicToken();
    const card = await prisma.card.create({
      data: {
        ...DEFAULT_CARD,
        replyUrl: null,
        token,
        expiresAt: getCardExpiry(),
      },
    });
    createdIds.push(card.id);

    const result = await readPublicCard(token);
    expect(result).toEqual({
      status: "active",
      card: { ...DEFAULT_CARD, replyUrl: "" },
    });
  });

  it("physically deletes expired cards", async () => {
    const token = createPublicToken();
    createdExpiredTokens.push(token);
    const card = await prisma.card.create({
      data: {
        ...DEFAULT_CARD,
        replyUrl: null,
        token,
        expiresAt: new Date(Date.now() - 1000),
      },
    });

    const deleted = await cleanupExpiredCards();
    expect(deleted).toBeGreaterThanOrEqual(1);
    await expect(
      prisma.card.findUnique({ where: { id: card.id } }),
    ).resolves.toBeNull();
    await expect(readPublicCard(token)).resolves.toEqual({
      status: "expired",
    });
  });

  it("cleans expired cards across multiple bounded batches", async () => {
    const cleanupTime = new Date("2026-07-27T12:00:00.000Z");
    const tokens = [
      createPublicToken(),
      createPublicToken(),
      createPublicToken(),
    ];
    createdExpiredTokens.push(...tokens);
    await prisma.card.createMany({
      data: tokens.map((token, index) => ({
        ...DEFAULT_CARD,
        replyUrl: null,
        token,
        expiresAt: new Date(cleanupTime.getTime() - index - 1),
      })),
    });

    const deleted = await cleanupExpiredCards(cleanupTime, { batchSize: 2 });

    expect(deleted).toBeGreaterThanOrEqual(tokens.length);
    await expect(
      prisma.card.count({ where: { token: { in: tokens } } }),
    ).resolves.toBe(0);
    await expect(
      prisma.expiredCardToken.count({ where: { token: { in: tokens } } }),
    ).resolves.toBe(tokens.length);
  });

  it("handles concurrent reads of one expired card without throwing", async () => {
    const token = createPublicToken();
    createdExpiredTokens.push(token);
    await prisma.card.create({
      data: {
        ...DEFAULT_CARD,
        replyUrl: null,
        token,
        expiresAt: new Date(Date.now() - 1000),
      },
    });

    const results = await Promise.all([
      readPublicCard(token),
      readPublicCard(token),
    ]);

    expect(results).toEqual([
      { status: "expired" },
      { status: "expired" },
    ]);
    await expect(readPublicCard(token)).resolves.toEqual({
      status: "expired",
    });
  });

  it("purges expired-card tombstones after the retention window", async () => {
    const token = createPublicToken();
    const cleanupTime = new Date("2026-07-27T12:00:00.000Z");
    await prisma.expiredCardToken.create({
      data: {
        token,
        expiredAt: new Date("2026-07-20T12:00:00.000Z"),
        retainedUntil: new Date("2026-07-27T11:59:59.000Z"),
      },
    });

    await cleanupExpiredCards(cleanupTime);

    await expect(readPublicCard(token)).resolves.toEqual({
      status: "missing",
    });
  });

  it("expires a stale tombstone during reads without waiting for cron", async () => {
    const token = createPublicToken();
    const now = Date.now();
    await prisma.expiredCardToken.create({
      data: {
        token,
        expiredAt: new Date(now - 31 * 24 * 60 * 60 * 1000),
        retainedUntil: new Date(now - 1000),
      },
    });

    await expect(readPublicCard(token)).resolves.toEqual({
      status: "missing",
    });
    await expect(
      prisma.expiredCardToken.findUnique({ where: { token } }),
    ).resolves.toBeNull();
  });
});

describe("card creation quotas", () => {
  it("rolls quota counters back when card insertion fails", async () => {
    const suffix = createPublicToken();
    const token = createPublicToken();
    const clientKey = `test-client:${suffix}`;
    const globalKey = `test-global:${suffix}`;
    createdQuotaKeys.push(clientKey, globalKey);
    const existingCard = await prisma.card.create({
      data: {
        ...DEFAULT_CARD,
        replyUrl: null,
        token,
        expiresAt: getCardExpiry(),
      },
    });
    createdIds.push(existingCard.id);

    await expect(
      prisma.$transaction(async (transaction) => {
        await enforceCardCreationQuota(transaction, clientKey, {
          clientLimit: 2,
          globalLimit: 3,
          globalKey,
        });
        await transaction.card.create({
          data: {
            ...DEFAULT_CARD,
            replyUrl: null,
            token,
            expiresAt: getCardExpiry(),
          },
        });
      }),
    ).rejects.toMatchObject({ code: "P2002" });

    await expect(
      prisma.cardCreationQuota.count({
        where: { key: { in: [clientKey, globalKey] } },
      }),
    ).resolves.toBe(0);
  });

  it("serializes concurrent requests for one client", async () => {
    const suffix = createPublicToken();
    const clientKey = `test-client:${suffix}`;
    const globalKey = `test-global:${suffix}`;
    createdQuotaKeys.push(clientKey, globalKey);

    const results = await Promise.all(
      Array.from({ length: 10 }, () =>
        consumeCardCreationQuota(clientKey, {
          clientLimit: 20,
          globalLimit: 20,
          globalKey,
        }),
      ),
    );

    expect(results).toEqual(Array.from({ length: 10 }, () => true));
  });

  it("limits one client atomically without consuming rejected global quota", async () => {
    const suffix = createPublicToken();
    const clientKey = `test-client:${suffix}`;
    const secondClientKey = `test-client-2:${suffix}`;
    const globalKey = `test-global:${suffix}`;
    createdQuotaKeys.push(clientKey, secondClientKey, globalKey);
    const now = new Date("2026-07-27T12:00:00.000Z");
    const options = {
      now,
      clientLimit: 2,
      globalLimit: 3,
      globalKey,
    };

    await expect(consumeCardCreationQuota(clientKey, options)).resolves.toBe(
      true,
    );
    await expect(consumeCardCreationQuota(clientKey, options)).resolves.toBe(
      true,
    );
    await expect(consumeCardCreationQuota(clientKey, options)).resolves.toBe(
      false,
    );
    await expect(
      consumeCardCreationQuota(secondClientKey, options),
    ).resolves.toBe(true);
    await expect(
      consumeCardCreationQuota(secondClientKey, options),
    ).resolves.toBe(false);
  });

  it("removes quota rows after two inactive windows", async () => {
    const suffix = createPublicToken();
    const clientKey = `test-client:${suffix}`;
    const globalKey = `test-global:${suffix}`;
    createdQuotaKeys.push(clientKey, globalKey);
    const createdAt = new Date("2026-07-27T12:00:00.000Z");

    await consumeCardCreationQuota(clientKey, {
      now: createdAt,
      clientLimit: 2,
      globalLimit: 3,
      globalKey,
    });

    const deleted = await cleanupStaleCardCreationQuotas(
      new Date("2026-07-27T14:00:00.001Z"),
    );

    expect(deleted).toBeGreaterThanOrEqual(2);
    await expect(
      prisma.cardCreationQuota.count({
        where: { key: { in: [clientKey, globalKey] } },
      }),
    ).resolves.toBe(0);
  });
});
