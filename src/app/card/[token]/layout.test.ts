import { describe, expect, it } from "vitest";
import { viewport } from "@/app/card/[token]/layout";

describe("card viewport", () => {
  it("uses the inside-scene color for browser viewport underlay", () => {
    expect(viewport).toMatchObject({
      initialScale: 1,
      themeColor: "#9a536d",
      viewportFit: "cover",
      width: "device-width",
    });
  });
});
