import { describe, expect, it } from "vitest";
import { GET as getManifest } from "@/app/[locale]/manifest.webmanifest/route";
import { messagesByLocale } from "@/i18n/messages";
import { routing } from "@/i18n/routing";

function messageKeys(
  value: Record<string, unknown>,
  prefix = "",
): string[] {
  return Object.entries(value).flatMap(([key, child]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return child && typeof child === "object" && !Array.isArray(child)
      ? messageKeys(child as Record<string, unknown>, path)
      : [path];
  });
}

describe("localization", () => {
  it("uses English as the product default", () => {
    expect(routing.defaultLocale).toBe("en");
    expect(routing.localeDetection).toBe(false);
  });

  it("keeps all locale dictionaries structurally aligned", () => {
    const expectedKeys = messageKeys(messagesByLocale.en).sort();
    expect(messageKeys(messagesByLocale.ru).sort()).toEqual(expectedKeys);
    expect(messageKeys(messagesByLocale.uk).sort()).toEqual(expectedKeys);
  });

  it("serves a localized web app manifest", async () => {
    const response = await getManifest(new Request("https://example.com"), {
      params: Promise.resolve({ locale: "uk" }),
    });

    expect(response.headers.get("content-type")).toContain(
      "application/manifest+json",
    );
    await expect(response.json()).resolves.toMatchObject({
      lang: "uk",
      start_url: "/uk/create",
      name: "Unseal — романтична листівка",
    });
  });
});
