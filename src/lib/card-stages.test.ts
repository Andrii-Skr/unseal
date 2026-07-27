import { describe, expect, it } from "vitest";
import {
  openedLockCount,
  stageAfterOpening,
} from "@/lib/card-stages";

describe("card stages", () => {
  it("keeps an exact lock count for every visible stage", () => {
    expect(openedLockCount("intro")).toBe(0);
    expect(openedLockCount("lock-3-opened")).toBe(3);
    expect(openedLockCount("all-locks-opened")).toBe(5);
    expect(openedLockCount("final-message")).toBe(5);
  });

  it("advances through locks in order", () => {
    expect([0, 1, 2, 3, 4].map(stageAfterOpening)).toEqual([
      "lock-1-opened",
      "lock-2-opened",
      "lock-3-opened",
      "lock-4-opened",
      "all-locks-opened",
    ]);
  });
});
