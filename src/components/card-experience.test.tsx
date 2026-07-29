// @vitest-environment jsdom

import {
  act,
  cleanup,
  fireEvent,
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
import { DEFAULT_CARD, getDefaultCard } from "@/lib/card-schema";
import { renderWithIntl } from "../../test/render-with-intl";

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
  it("uses the locale stored in the card", () => {
    const englishCard = getDefaultCard("en");
    renderWithIntl(<CardExperience card={englishCard} />, "en");

    expect(
      screen.getByRole("button", { name: "Open the first lock" }),
    ).toBeVisible();
    expect(
      screen.queryByRole("button", { name: "Открыть первый замок" }),
    ).not.toBeInTheDocument();
  });

  it("reserves a stable region below the heart for changing messages", () => {
    renderWithIntl(<CardExperience card={DEFAULT_CARD} />);

    expect(screen.getByTestId("message-region")).toHaveClass(
      "min-h-48",
      "shrink-0",
    );
  });

  it("announces stage changes without moving focus to hidden content", async () => {
    useReducedMotionPreference();
    const user = userEvent.setup();
    renderWithIntl(<CardExperience card={DEFAULT_CARD} />);
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
    renderWithIntl(<CardExperience card={DEFAULT_CARD} />);

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
    expect(screen.getByTestId("heart-zoom-transition")).toHaveAttribute(
      "data-active",
      "true",
    );
    expect(screen.getByRole("main")).toBeInTheDocument();
    expect(
      screen.queryByTestId("inside-heart-backdrop"),
    ).not.toBeInTheDocument();
    expect(screen.getByTestId("inside-heart-preload")).not.toBeVisible();

    act(() => vi.advanceTimersByTime(220));
    expect(screen.getByRole("main")).toBeInTheDocument();
    expect(screen.getByTestId("heart-zoom-transition")).toHaveAttribute(
      "data-active",
      "true",
    );

    act(() => vi.advanceTimersByTime(1_980));
    expect(screen.queryByRole("main")).not.toBeInTheDocument();
    expect(screen.getByTestId("inside-heart-backdrop")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(
      "Теперь ты внутри",
    );
  });

  it("hides the previous message while the final lock is opening", () => {
    useReducedMotionPreference();
    vi.useFakeTimers();
    renderWithIntl(<CardExperience card={DEFAULT_CARD} />);

    for (const label of [
      "Открыть первый замок",
      "Продолжить",
      "Ещё один замок",
      "Стать немного ближе",
    ]) {
      fireEvent.click(screen.getByRole("button", { name: label }));
      act(() => vi.advanceTimersByTime(150));
    }

    const messageStep = screen.getByTestId("message-step");
    fireEvent.click(
      screen.getByRole("button", { name: "Открыть сердце" }),
    );

    expect(screen.getByTestId("message-content")).toHaveClass("opacity-0");
    expect(screen.getByTestId("message-step")).toBe(messageStep);

    act(() => vi.advanceTimersByTime(150));

    expect(screen.getByTestId("message-content")).toHaveClass("opacity-100");
    expect(screen.getByTestId("message-step")).toBe(messageStep);
    expect(
      within(screen.getByTestId("message-content")).getByText(
        DEFAULT_CARD.preHeartPhrase,
      ),
    ).toBeVisible();
  });
});
