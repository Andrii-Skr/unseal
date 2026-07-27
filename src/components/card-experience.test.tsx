// @vitest-environment jsdom

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { CardExperience } from "@/components/card-experience";
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
});

describe("CardExperience", () => {
  it("keeps a persistent status region focused after a stage change", async () => {
    useReducedMotionPreference();
    const user = userEvent.setup();
    render(<CardExperience card={DEFAULT_CARD} />);
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: `Открытка для ${DEFAULT_CARD.recipientName}`,
      }),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "Открыть первый замок" }),
    );

    const status = screen.getByRole("status");
    await waitFor(
      () => {
        expect(status).toHaveTextContent(
          DEFAULT_CARD.intermediatePhrases[0],
        );
        expect(status).toHaveFocus();
      },
      { timeout: 1_000 },
    );
  });
});
