// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from "vitest";
import { copyText } from "@/lib/clipboard";

const clipboardDescriptor = Object.getOwnPropertyDescriptor(
  navigator,
  "clipboard",
);
const execCommandDescriptor = Object.getOwnPropertyDescriptor(
  document,
  "execCommand",
);

describe("copyText", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    if (clipboardDescriptor) {
      Object.defineProperty(navigator, "clipboard", clipboardDescriptor);
    } else {
      Reflect.deleteProperty(navigator, "clipboard");
    }
    if (execCommandDescriptor) {
      Object.defineProperty(document, "execCommand", execCommandDescriptor);
    } else {
      Reflect.deleteProperty(document, "execCommand");
    }
  });

  it("uses the Clipboard API when it is available", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });

    await expect(copyText("https://example.com/card")).resolves.toBe(true);
    expect(writeText).toHaveBeenCalledWith("https://example.com/card");
  });

  it("falls back to execCommand on an insecure LAN origin", async () => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: undefined,
    });
    const execCommand = vi.fn(() => true);
    Object.defineProperty(document, "execCommand", {
      configurable: true,
      value: execCommand,
    });
    const previousFocus = document.createElement("button");
    document.body.append(previousFocus);
    previousFocus.focus();

    try {
      await expect(
        copyText("http://192.168.1.10:3010/card/token"),
      ).resolves.toBe(true);
      expect(execCommand).toHaveBeenCalledWith("copy");
      expect(document.querySelector("textarea[aria-hidden='true']")).toBeNull();
      expect(previousFocus).toHaveFocus();
    } finally {
      previousFocus.remove();
    }
  });
});
