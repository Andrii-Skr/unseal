import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { headersMock } = vi.hoisted(() => ({
  headersMock: vi.fn(),
}));

vi.mock("next/headers", () => ({
  headers: headersMock,
}));

import { getCardCreationClientKey } from "@/lib/card-rate-limit";

function setRequestHeaders(values: Record<string, string>) {
  headersMock.mockResolvedValue(new Headers(values));
}

describe("card creation client identity", () => {
  beforeEach(() => {
    vi.stubEnv("RATE_LIMIT_SECRET", "card-rate-limit-test-secret");
    vi.stubEnv("NODE_ENV", "test");
  });

  afterEach(() => {
    headersMock.mockReset();
    vi.unstubAllEnvs();
  });

  it("ignores proxy IP headers unless one is explicitly trusted", async () => {
    setRequestHeaders({
      "accept-language": "ru",
      "cf-connecting-ip": "198.51.100.1",
      "user-agent": "test-browser",
      "x-forwarded-for": "198.51.100.2",
      "x-real-ip": "198.51.100.3",
    });
    const firstKey = await getCardCreationClientKey();

    setRequestHeaders({
      "accept-language": "ru",
      "cf-connecting-ip": "203.0.113.1",
      "user-agent": "test-browser",
      "x-forwarded-for": "203.0.113.2",
      "x-real-ip": "203.0.113.3",
    });

    await expect(getCardCreationClientKey()).resolves.toBe(firstKey);
  });

  it("uses only the configured trusted proxy header", async () => {
    vi.stubEnv("RATE_LIMIT_TRUSTED_IP_HEADER", "x-real-ip");
    setRequestHeaders({
      "cf-connecting-ip": "198.51.100.1",
      "x-real-ip": "198.51.100.2",
    });
    const firstKey = await getCardCreationClientKey();

    setRequestHeaders({
      "cf-connecting-ip": "203.0.113.1",
      "x-real-ip": "198.51.100.2",
    });
    await expect(getCardCreationClientKey()).resolves.toBe(firstKey);

    setRequestHeaders({ "x-real-ip": "203.0.113.2" });
    await expect(getCardCreationClientKey()).resolves.not.toBe(firstKey);
  });

  it("rejects requests missing the configured trusted proxy header", async () => {
    vi.stubEnv("RATE_LIMIT_TRUSTED_IP_HEADER", "x-real-ip");
    setRequestHeaders({
      "accept-language": "ru",
      "user-agent": "test-browser",
    });

    await expect(getCardCreationClientKey()).rejects.toThrow(
      "Trusted client IP header is missing: x-real-ip",
    );
  });

  it("refuses to guess a trusted IP header in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    setRequestHeaders({ "x-forwarded-for": "198.51.100.1" });

    await expect(getCardCreationClientKey()).rejects.toThrow(
      "RATE_LIMIT_TRUSTED_IP_HEADER is not configured",
    );
  });

  it("rejects unsupported trusted header names", async () => {
    vi.stubEnv("RATE_LIMIT_TRUSTED_IP_HEADER", "client-ip");
    setRequestHeaders({ "client-ip": "198.51.100.1" });

    await expect(getCardCreationClientKey()).rejects.toThrow(
      "Unsupported RATE_LIMIT_TRUSTED_IP_HEADER",
    );
  });
});
