import { describe, expect, it } from "vitest";
import {
  cardInputSchema,
  DEFAULT_CARD,
  DEFAULT_FINAL_MESSAGE,
  makeSignature,
} from "@/lib/card-schema";

describe("cardInputSchema", () => {
  it("does not include the removed gifts paragraph in the default message", () => {
    expect(DEFAULT_FINAL_MESSAGE).not.toContain(
      "Здесь нет подарков и драгоценностей.",
    );
  });

  it("accepts the complete default card", () => {
    expect(cardInputSchema.safeParse(DEFAULT_CARD).success).toBe(true);
  });

  it("accepts a card without a signature", () => {
    expect(
      cardInputSchema.safeParse({ ...DEFAULT_CARD, signature: "" }).success,
    ).toBe(true);
  });

  it("requires exactly four intermediate phrases", () => {
    const result = cardInputSchema.safeParse({
      ...DEFAULT_CARD,
      intermediatePhrases: ["one", "two", "three"],
    });

    expect(result.success).toBe(false);
  });

  it.each([
    "javascript:alert(1)",
    "http://example.com",
    "data:text/html,hello",
  ])("rejects unsafe reply URL %s", (replyUrl) => {
    expect(
      cardInputSchema.safeParse({ ...DEFAULT_CARD, replyUrl }).success,
    ).toBe(false);
  });

  it.each(["", "https://t.me/example", "mailto:hello@example.com"])(
    "accepts supported reply URL %s",
    (replyUrl) => {
      expect(
        cardInputSchema.safeParse({ ...DEFAULT_CARD, replyUrl }).success,
      ).toBe(true);
    },
  );

  it("builds a personalized signature", () => {
    expect(makeSignature("Лея", "Алекс")).toBe(
      "Для тебя, Лея.\nС теплом, Алекс",
    );
  });
});
