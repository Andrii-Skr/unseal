// @vitest-environment jsdom

import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  within,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { CardExperience } from "@/components/card-experience";
import { DEFAULT_CARD } from "@/lib/card-schema";

const originalMatchMedia = window.matchMedia;

beforeEach(() => {
  vi.spyOn(window, "scrollTo").mockImplementation(() => undefined);
  vi.spyOn(HTMLMediaElement.prototype, "load").mockImplementation(
    () => undefined,
  );
  vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(
    () => undefined,
  );
  vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue(undefined);
});

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
  cleanup();
  window.matchMedia = originalMatchMedia;
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe("CardExperience", () => {
  it("reserves a stable region below the heart for changing messages", () => {
    render(<CardExperience card={DEFAULT_CARD} />);

    expect(screen.getByTestId("message-region")).toHaveClass(
      "min-h-48",
      "shrink-0",
    );
  });

  it("announces stage changes without moving focus to hidden content", async () => {
    useReducedMotionPreference();
    const user = userEvent.setup();
    render(<CardExperience card={DEFAULT_CARD} />);
    const messageStep = screen.getByTestId("message-step");
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
        expect(status).not.toHaveFocus();
        expect(status).toHaveAttribute("aria-live", "polite");
        expect(screen.getByTestId("message-step")).toBe(messageStep);
      },
      { timeout: 1_000 },
    );
  });

  it("waits for explicit confirmation before entering the heart", () => {
    useReducedMotionPreference();
    vi.useFakeTimers();
    render(<CardExperience card={DEFAULT_CARD} />);

    const lockButtons = [
      "Открыть первый замок",
      "Продолжить",
      "Ещё один замок",
      "Стать немного ближе",
      "Открыть сердце",
    ];

    for (const label of lockButtons) {
      fireEvent.click(screen.getByRole("button", { name: label }));
      act(() => vi.advanceTimersByTime(150));
    }

    const bridgePhrase = within(screen.getByRole("main")).getByText(
      DEFAULT_CARD.preHeartPhrase,
    );
    expect(bridgePhrase).toBeInTheDocument();
    const enterButton = screen.getByRole("button", {
      name: "Заглянуть внутрь сердца",
    });
    expect(enterButton).toBeEnabled();

    act(() => vi.advanceTimersByTime(10_000));
    expect(bridgePhrase).toBeInTheDocument();

    fireEvent.click(enterButton);
    expect(screen.getByTestId("heart-zoom-transition")).toBeInTheDocument();
  });
});
