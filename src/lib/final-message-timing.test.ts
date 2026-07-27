import { describe, expect, it } from "vitest";
import {
  MAX_MESSAGE_SEQUENCE_SECONDS,
  messageRevealDelay,
  signatureRevealDelay,
} from "@/lib/final-message-timing";

describe("final message timing", () => {
  it("caps long message sequences before the controls appear", () => {
    const lastBlockDelay = messageRevealDelay(99);
    const signatureDelay = signatureRevealDelay(100);

    expect(lastBlockDelay).toBeCloseTo(5.1);
    expect(signatureDelay).toBeGreaterThan(lastBlockDelay);
    expect(MAX_MESSAGE_SEQUENCE_SECONDS).toBeLessThan(8);
  });

  it("keeps the signature after the final short-message block", () => {
    expect(signatureRevealDelay(5)).toBeGreaterThan(messageRevealDelay(4));
  });
});
