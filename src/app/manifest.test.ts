import { describe, expect, it } from "vitest";
import manifest from "@/app/manifest";

describe("web app manifest", () => {
  it("provides standard and maskable heart icons", () => {
    expect(manifest().icons).toEqual([
      expect.objectContaining({
        src: "/icons/icon-192.png",
        sizes: "192x192",
        purpose: "any",
      }),
      expect.objectContaining({
        src: "/icons/icon-512.png",
        sizes: "512x512",
        purpose: "any",
      }),
      expect.objectContaining({
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        purpose: "maskable",
      }),
    ]);
  });
});
