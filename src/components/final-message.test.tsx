// @vitest-environment jsdom

import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  FinalMessage,
  KeepsakeContent,
} from "@/components/final-message";
import { DEFAULT_CARD } from "@/lib/card-schema";

const originalMatchMedia = window.matchMedia;

function useReducedMotionPreference() {
  window.matchMedia = (query: string) =>
    ({
      matches: query === "(prefers-reduced-motion: reduce)",
      media: query,
      onchange: null,
      addEventListener: () => undefined,
      addListener: () => undefined,
      dispatchEvent: () => false,
      removeEventListener: () => undefined,
      removeListener: () => undefined,
    }) as MediaQueryList;
}

afterEach(() => {
  window.matchMedia = originalMatchMedia;
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe("FinalMessage", () => {
  it("shows controls immediately when reduced motion is preferred", () => {
    useReducedMotionPreference();
    render(<FinalMessage card={DEFAULT_CARD} onReplay={() => undefined} />);

    expect(
      screen.getByRole("button", { name: "Сохранить воспоминание" }),
    ).toBeEnabled();
    expect(
      screen.getByRole("button", {
        name: "Пережить этот момент ещё раз",
      }),
    ).toBeEnabled();
  });

  it("keeps the reply link unfocusable until controls are revealed", () => {
    vi.useFakeTimers();
    render(
      <FinalMessage
        card={{ ...DEFAULT_CARD, replyUrl: "https://example.com/reply" }}
        onReplay={() => undefined}
      />,
    );

    const replyLink = screen.getByText("Ответить отправителю").closest("a");
    expect(replyLink).not.toHaveAttribute("href");
    expect(replyLink).toHaveAttribute("tabindex", "-1");

    act(() => vi.advanceTimersByTime(8_000));
    expect(replyLink).toHaveAttribute("href", "https://example.com/reply");
    expect(replyLink).not.toHaveAttribute("tabindex");
  });

  it("prevents replay while a keepsake is being prepared", () => {
    useReducedMotionPreference();
    vi.spyOn(window, "requestAnimationFrame").mockImplementation(() => 1);
    render(<FinalMessage card={DEFAULT_CARD} onReplay={() => undefined} />);

    fireEvent.click(
      screen.getByRole("button", { name: "Сохранить воспоминание" }),
    );

    expect(
      screen.getByRole("button", {
        name: "Пережить этот момент ещё раз",
      }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Создаём PNG…" }),
    ).toBeDisabled();
  });

  it("puts every final-message block into the keepsake", () => {
    const blocks = DEFAULT_CARD.finalMessage.split(/\n\s*\n/);

    render(
      <KeepsakeContent
        blocks={blocks}
        signature={DEFAULT_CARD.signature}
      />,
    );

    const renderedBlocks = screen
      .getAllByText((_, element) =>
        element?.hasAttribute("data-keepsake-block") ?? false,
      );

    expect(renderedBlocks).toHaveLength(blocks.length);
    blocks.forEach((block, index) => {
      expect(renderedBlocks[index]).toHaveTextContent(
        block.replace(/\s+/g, " "),
      );
    });
    expect(screen.getByTestId("keepsake-content")).toHaveTextContent(
      DEFAULT_CARD.signature.replace(/\s+/g, " "),
    );
  });
});
