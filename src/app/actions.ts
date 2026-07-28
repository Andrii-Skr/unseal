"use server";

import { Prisma } from "@/generated/prisma/client";
import {
  cardInputSchema,
  type CardInput,
} from "@/lib/card-schema";
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
  const parsed = cardInputSchema.safeParse(input);

  if (!parsed.success) {
    const fields: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path.map(String).join(".");
      if (!field) continue;
      (fields[field] ??= []).push(issue.message);
    }

    return {
      ok: false,
      message: "Проверьте заполненные поля",
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
      message:
        "Не удалось проверить возможность публикации. Попробуйте ещё раз.",
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
          message:
            "Слишком много открыток за короткое время. Попробуйте снова через час.",
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
        message:
          "Не удалось сохранить открытку. Проверьте подключение к базе и попробуйте снова.",
      };
    }
  }

  return {
    ok: false,
    message: "Не удалось создать уникальную ссылку. Попробуйте ещё раз.",
  };
}
