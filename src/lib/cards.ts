import "server-only";

import { cache } from "react";
import type { CardInput } from "@/lib/card-schema";
import { prisma } from "@/lib/prisma";
import { isCardExpired } from "@/lib/tokens";

const EXPIRED_TOKEN_RETENTION_MS = 30 * 24 * 60 * 60 * 1000;
const EXPIRED_CARD_CLEANUP_BATCH_SIZE = 500;
const CLEANUP_TRANSACTION_OPTIONS = {
  maxWait: 5_000,
  timeout: 10_000,
} as const;

type CleanupExpiredCardsOptions = {
  batchSize?: number;
};

type PublicCardResult =
  | { status: "missing" }
  | { status: "expired"; language: CardInput["language"] }
  | { status: "active"; card: CardInput };

export async function readPublicCard(token: string): Promise<PublicCardResult> {
  if (!/^[A-Za-z0-9_-]{43}$/.test(token)) {
    return { status: "missing" };
  }

  const card = await prisma.card.findUnique({ where: { token } });

  if (!card) {
    const expiredToken = await prisma.expiredCardToken.findUnique({
      where: { token },
      select: { retainedUntil: true, language: true },
    });
    if (!expiredToken) return { status: "missing" };

    const now = new Date();
    if (expiredToken.retainedUntil <= now) {
      await prisma.expiredCardToken.deleteMany({
        where: { token, retainedUntil: { lte: now } },
      });
      return { status: "missing" };
    }

    return { status: "expired", language: expiredToken.language };
  }

  if (isCardExpired(card.expiresAt)) {
    const now = new Date();
    await prisma.$transaction([
      prisma.expiredCardToken.upsert({
        where: { token },
        create: {
          token,
          expiredAt: card.expiresAt,
          retainedUntil: new Date(
            now.getTime() + EXPIRED_TOKEN_RETENTION_MS,
          ),
          language: card.language,
        },
        update: {},
      }),
      prisma.card.deleteMany({
        where: { id: card.id, expiresAt: { lte: now } },
      }),
    ]);
    return { status: "expired", language: card.language };
  }

  if (card.intermediatePhrases.length !== 4) {
    return { status: "missing" };
  }

  return {
    status: "active",
    card: {
      senderName: card.senderName,
      language: card.language,
      recipientName: card.recipientName,
      introPhrase: card.introPhrase,
      intermediatePhrases: [
        card.intermediatePhrases[0],
        card.intermediatePhrases[1],
        card.intermediatePhrases[2],
        card.intermediatePhrases[3],
      ],
      preHeartPhrase: card.preHeartPhrase,
      finalMessage: card.finalMessage,
      signature: card.signature,
      soundEnabled: card.soundEnabled,
      replyUrl: card.replyUrl ?? "",
    },
  };
}

export const getPublicCard = cache(readPublicCard);

export async function cleanupExpiredCards(
  now = new Date(),
  options: CleanupExpiredCardsOptions = {},
) {
  const batchSize =
    options.batchSize ?? EXPIRED_CARD_CLEANUP_BATCH_SIZE;
  if (!Number.isSafeInteger(batchSize) || batchSize < 1) {
    throw new Error("Expired-card cleanup batch size must be a positive integer");
  }

  const retainedUntil = new Date(
    now.getTime() + EXPIRED_TOKEN_RETENTION_MS,
  );

  while (true) {
    const staleTokens = await prisma.expiredCardToken.findMany({
      where: { retainedUntil: { lte: now } },
      orderBy: { retainedUntil: "asc" },
      take: batchSize,
      select: { token: true },
    });
    if (staleTokens.length === 0) break;

    await prisma.expiredCardToken.deleteMany({
      where: {
        token: { in: staleTokens.map(({ token }) => token) },
        retainedUntil: { lte: now },
      },
    });
    if (staleTokens.length < batchSize) break;
  }

  let deletedCount = 0;

  while (true) {
    const batch = await prisma.$transaction(
      async (transaction) => {
        const expiredCards = await transaction.card.findMany({
          where: { expiresAt: { lte: now } },
          orderBy: { expiresAt: "asc" },
          take: batchSize,
          select: {
            id: true,
            token: true,
            expiresAt: true,
            language: true,
          },
        });
        if (expiredCards.length === 0) {
          return { deleted: 0, selected: 0 };
        }

        await transaction.expiredCardToken.createMany({
          data: expiredCards.map((card) => ({
            token: card.token,
            expiredAt: card.expiresAt,
            retainedUntil,
            language: card.language,
          })),
          skipDuplicates: true,
        });
        const deleted = await transaction.card.deleteMany({
          where: {
            id: { in: expiredCards.map(({ id }) => id) },
            expiresAt: { lte: now },
          },
        });

        return {
          deleted: deleted.count,
          selected: expiredCards.length,
        };
      },
      CLEANUP_TRANSACTION_OPTIONS,
    );

    deletedCount += batch.deleted;
    if (batch.selected < batchSize) break;
  }

  return deletedCount;
}
