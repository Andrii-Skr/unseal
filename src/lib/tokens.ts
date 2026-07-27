import { randomBytes } from "node:crypto";

export const CARD_LIFETIME_MS = 7 * 24 * 60 * 60 * 1000;

export function createPublicToken() {
  return randomBytes(32).toString("base64url");
}

export function getCardExpiry(from = new Date()) {
  return new Date(from.getTime() + CARD_LIFETIME_MS);
}

export function isCardExpired(expiresAt: Date, now = new Date()) {
  return expiresAt.getTime() <= now.getTime();
}
