// @vitest-environment jsdom

import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import CardError from "@/app/card/[token]/error";
import { renderWithIntl } from "../../../../test/render-with-intl";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("CardError", () => {
  it("offers Next.js retry recovery without exposing error details", async () => {
    const user = userEvent.setup();
    const unstableRetry = vi.fn();
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    renderWithIntl(
      <CardError
        error={new Error("database credentials leaked here")}
        unstable_retry={unstableRetry}
      />,
      "ru",
    );

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Не удалось открыть открытку",
      }),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("database credentials leaked here"),
    ).not.toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "Попробовать снова" }),
    );
    expect(unstableRetry).toHaveBeenCalledOnce();
  });
});
