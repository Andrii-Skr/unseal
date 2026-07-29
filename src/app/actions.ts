"use server";

import { Prisma } from "@/generated/prisma/client";
import {
  createCardInputSchema,
  resolveCardLocale,
  type CardInput,
} from "@/lib/card-schema";
import { getMessagesForLocale } from "@/i18n/messages";
import {
  CardCreationQuotaExceededError,
  enforceCardCreationQuota,
  getCardCreationClientKey,
} from "@/lib/card-rate-limit";
import { prisma } from "@/lib/prisma";
import { createPublicToken, getCardExpiry } from "@/lib/tokens";

export type CreateCardResult =
  | { ok: true; token: string }
  | { ok: false; message: string; fields?: Record<string, string[]> };

export async function createCard(input: CardInput): Promise<CreateCardResult> {
  const locale = resolveCardLocale(input?.language);
  const messages = getMessagesForLocale(locale);
  const parsed = createCardInputSchema(locale).safeParse(input);

  if (!parsed.success) {
    const fields: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path.map(String).join(".");
      if (!field) continue;
      (fields[field] ??= []).push(issue.message);
    }

    return {
      ok: false,
      message: messages.Validation.checkFields,
      fields,
    };
  }

  let clientKey: string;
  try {
    clientKey = await getCardCreationClientKey();
  } catch (error) {
    console.error("Card creation quota check failed", error);
    return {
      ok: false,
      message: messages.Server.quotaCheck,
    };
  }

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const token = createPublicToken();

    try {
      await prisma.$transaction(
        async (transaction) => {
          await enforceCardCreationQuota(transaction, clientKey);
          await transaction.card.create({
            data: {
              ...parsed.data,
              replyUrl: parsed.data.replyUrl || null,
              token,
              expiresAt: getCardExpiry(),
            },
          });
        },
        { maxWait: 5_000, timeout: 10_000 },
      );

      return { ok: true, token };
    } catch (error) {
      if (error instanceof CardCreationQuotaExceededError) {
        return {
          ok: false,
          message: messages.Server.quotaExceeded,
        };
      }

      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        continue;
      }

      console.error("Card creation failed", error);
      return {
        ok: false,
        message: messages.Server.saveFailed,
      };
    }
  }

  return {
    ok: false,
    message: messages.Server.tokenFailed,
  };
}
