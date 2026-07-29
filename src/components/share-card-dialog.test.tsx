// @vitest-environment jsdom

import { useState } from "react";
import {
  act,
  fireEvent,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ShareCardDialog } from "@/components/share-card-dialog";
import { copyText } from "@/lib/clipboard";
import { renderWithIntl } from "../../test/render-with-intl";

vi.mock("@/lib/clipboard", () => ({
  copyText: vi.fn().mockResolvedValue(true),
}));

afterEach(() => {
  vi.useRealTimers();
  vi.mocked(copyText).mockReset();
  vi.mocked(copyText).mockResolvedValue(true);
});

function ShareDialogHarness() {
  const [open, setOpen] = useState(true);

  return (
    <>
      <button onClick={() => setOpen(true)} type="button">
        Открыть диалог
      </button>
      <ShareCardDialog
        onOpenChange={setOpen}
        open={open}
        url="https://example.com/card/test"
      />
    </>
  );
}

describe("ShareCardDialog", () => {
  it("restarts the copied-status timeout after a repeated copy", async () => {
    vi.useFakeTimers();
    renderWithIntl(
      <ShareCardDialog
        onOpenChange={() => undefined}
        open
        url="https://example.com/card/test"
      />,
    );

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Копировать" }));
    });
    expect(
      screen.getByRole("button", { name: "Готово" }),
    ).toBeInTheDocument();

    act(() => vi.advanceTimersByTime(1_000));
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Готово" }));
    });
    act(() => vi.advanceTimersByTime(900));
    expect(
      screen.getByRole("button", { name: "Готово" }),
    ).toBeInTheDocument();

    act(() => vi.advanceTimersByTime(900));
    expect(
      screen.getByRole("button", { name: "Копировать" }),
    ).toBeInTheDocument();
  });

  it("ignores a copy operation that finishes after the dialog closes", async () => {
    let resolveCopy: ((copied: boolean) => void) | undefined;
    vi.mocked(copyText).mockImplementationOnce(
      () =>
        new Promise<boolean>((resolve) => {
          resolveCopy = resolve;
        }),
    );
    renderWithIntl(<ShareDialogHarness />);

    fireEvent.click(screen.getByRole("button", { name: "Копировать" }));
    fireEvent.click(screen.getByRole("button", { name: "Закрыть" }));
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );

    await act(async () => resolveCopy?.(true));
    fireEvent.click(screen.getByRole("button", { name: "Открыть диалог" }));

    expect(
      screen.getByRole("button", { name: "Копировать" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Готово" }),
    ).not.toBeInTheDocument();
  });
});
