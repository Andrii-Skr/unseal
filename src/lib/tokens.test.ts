import { describe, expect, it } from "vitest";
import {
  CARD_LIFETIME_MS,
  createPublicToken,
  getCardExpiry,
  isCardExpired,
} from "@/lib/tokens";

describe("card tokens and expiry", () => {
  it("creates 256-bit base64url public tokens", () => {
    const token = createPublicToken();
    expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(createPublicToken()).not.toBe(token);
  });

  it("expires exactly seven days after creation", () => {
    const createdAt = new Date("2026-07-27T10:00:00.000Z");
    const expiresAt = getCardExpiry(createdAt);

    expect(expiresAt.getTime() - createdAt.getTime()).toBe(CARD_LIFETIME_MS);
    expect(isCardExpired(expiresAt, new Date(expiresAt.getTime() - 1))).toBe(
      false,
    );
    expect(isCardExpired(expiresAt, expiresAt)).toBe(true);
  });
});
