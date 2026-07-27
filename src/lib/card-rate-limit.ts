import "server-only";

import { createHmac } from "node:crypto";
import { headers } from "next/headers";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

const WINDOW_MS = 60 * 60 * 1000;
const DEFAULT_CLIENT_LIMIT = 20;
const DEFAULT_GLOBAL_LIMIT = 500;
const GLOBAL_QUOTA_KEY = "global";
const TRUSTED_IP_HEADERS = new Set([
  "cf-connecting-ip",
  "x-forwarded-for",
  "x-real-ip",
]);

type QuotaResult = {
  count: number;
};

type QuotaClient = Pick<Prisma.TransactionClient, "$queryRaw">;

type CardCreationQuotaOptions = {
  now?: Date;
  clientLimit?: number;
  globalLimit?: number;
  globalKey?: string;
};

export class CardCreationQuotaExceededError extends Error {}

function getRateLimitSecret() {
  const secret = process.env.RATE_LIMIT_SECRET;

  if (secret) return secret;
  if (process.env.NODE_ENV !== "production") {
    return "unseal-development-rate-limit-secret";
  }

  throw new Error("RATE_LIMIT_SECRET is not configured");
}

function hashIdentity(identity: string) {
  return createHmac("sha256", getRateLimitSecret())
    .update(identity)
    .digest("hex");
}

function firstForwardedAddress(value: string | null) {
  return value?.split(",", 1)[0]?.trim() || null;
}

function getTrustedClientAddress(requestHeaders: Headers) {
  const configuredHeader = process.env.RATE_LIMIT_TRUSTED_IP_HEADER
    ?.trim()
    .toLowerCase();

  if (!configuredHeader) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("RATE_LIMIT_TRUSTED_IP_HEADER is not configured");
    }

    return null;
  }
  if (!TRUSTED_IP_HEADERS.has(configuredHeader)) {
    throw new Error(
      `Unsupported RATE_LIMIT_TRUSTED_IP_HEADER: ${configuredHeader}`,
    );
  }

  const value = requestHeaders.get(configuredHeader);
  const address = configuredHeader === "x-forwarded-for"
    ? firstForwardedAddress(value)
    : value?.trim() || null;

  if (!address) {
    throw new Error(
      `Trusted client IP header is missing: ${configuredHeader}`,
    );
  }

  return address;
}

export async function getCardCreationClientKey() {
  const requestHeaders = await headers();
  const address = getTrustedClientAddress(requestHeaders);
  const fallbackFingerprint = [
    requestHeaders.get("user-agent") ?? "unknown-agent",
    requestHeaders.get("accept-language") ?? "unknown-language",
  ].join("|");
  const identity = address
    ? `address:${address}`
    : `fallback:${fallbackFingerprint}`;

  return `client:${hashIdentity(identity)}`;
}

async function consumeQuota(
  client: QuotaClient,
  key: string,
  limit: number,
  now: Date,
) {
  const resetBefore = new Date(now.getTime() - WINDOW_MS);
  const rows = await client.$queryRaw<QuotaResult[]>`
    INSERT INTO "CardCreationQuota" (
      "key",
      "windowStartedAt",
      "count",
      "updatedAt"
    )
    VALUES (${key}, ${now}, 1, ${now})
    ON CONFLICT ("key") DO UPDATE
    SET
      "windowStartedAt" = CASE
        WHEN "CardCreationQuota"."windowStartedAt" <= ${resetBefore}
          THEN ${now}
        ELSE "CardCreationQuota"."windowStartedAt"
      END,
      "count" = CASE
        WHEN "CardCreationQuota"."windowStartedAt" <= ${resetBefore}
          THEN 1
        ELSE LEAST("CardCreationQuota"."count" + 1, ${limit + 1})
      END,
      "updatedAt" = ${now}
    RETURNING "count"
  `;

  return (rows[0]?.count ?? limit + 1) <= limit;
}

export async function enforceCardCreationQuota(
  client: QuotaClient,
  clientKey: string,
  options: CardCreationQuotaOptions = {},
) {
  const now = options.now ?? new Date();
  const clientLimit = options.clientLimit ?? DEFAULT_CLIENT_LIMIT;
  const globalLimit = options.globalLimit ?? DEFAULT_GLOBAL_LIMIT;
  const globalKey = options.globalKey ?? GLOBAL_QUOTA_KEY;

  if (!(await consumeQuota(client, globalKey, globalLimit, now))) {
    throw new CardCreationQuotaExceededError();
  }

  if (!(await consumeQuota(client, clientKey, clientLimit, now))) {
    throw new CardCreationQuotaExceededError();
  }
}

export async function consumeCardCreationQuota(
  clientKey: string,
  options: CardCreationQuotaOptions = {},
) {
  try {
    await prisma.$transaction(
      (transaction) =>
        enforceCardCreationQuota(transaction, clientKey, options),
      { maxWait: 5_000, timeout: 10_000 },
    );

    return true;
  } catch (error) {
    if (error instanceof CardCreationQuotaExceededError) return false;
    throw error;
  }
}

export async function cleanupStaleCardCreationQuotas(now = new Date()) {
  const staleBefore = new Date(now.getTime() - WINDOW_MS * 2);
  const result = await prisma.cardCreationQuota.deleteMany({
    where: { updatedAt: { lte: staleBefore } },
  });

  return result.count;
}
