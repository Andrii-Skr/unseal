// @vitest-environment jsdom

import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createCard } from "@/app/actions";
import { CardCreatorForm } from "@/components/card-creator-form";
import { getDefaultCard } from "@/lib/card-schema";
import { renderWithIntl } from "../../test/render-with-intl";

const { replaceLocale } = vi.hoisted(() => ({
  replaceLocale: vi.fn(),
}));

vi.mock("@/app/actions", () => ({
  createCard: vi.fn(),
}));

vi.mock("@/i18n/navigation", () => ({
  usePathname: () => "/create",
  useRouter: () => ({ replace: replaceLocale }),
}));

afterEach(() => {
  vi.resetAllMocks();
  window.sessionStorage.clear();
});

describe("CardCreatorForm", () => {
  it("associates a validation error with its field", async () => {
    const user = userEvent.setup();
    renderWithIntl(<CardCreatorForm locale="ru" />);
    expect(
      screen.getByRole("heading", { level: 1, name: "Unseal" }),
    ).toBeInTheDocument();
    const senderName = screen.getByLabelText("Ваше имя");

    await user.clear(senderName);
    await user.tab();

    const error = await screen.findByRole("alert");
    expect(error).toHaveTextContent("Укажите имя отправителя");
    expect(error).toHaveAttribute("id", "senderName-error");
    expect(senderName).toHaveAttribute("aria-invalid", "true");
    expect(senderName).toHaveAttribute(
      "aria-describedby",
      "senderName-error",
    );
  });

  it("associates the sound explanation with its switch", () => {
    renderWithIntl(<CardCreatorForm locale="ru" />);

    const soundSwitch = screen.getByRole("switch", {
      name: "Звуки истории",
    });
    expect(soundSwitch).toHaveAccessibleDescription(
      "Колокольчик прозвучит только после нажатия на замок; получатель сможет выключить его.",
    );
  });

  it("marks required fields programmatically", () => {
    renderWithIntl(<CardCreatorForm locale="ru" />);

    expect(screen.getByLabelText("Ваше имя")).toHaveAttribute(
      "aria-required",
      "true",
    );
    expect(screen.getByLabelText("Финальное послание")).toHaveAttribute(
      "aria-required",
      "true",
    );
    expect(
      screen.getByLabelText("Подпись, необязательно"),
    ).not.toHaveAttribute("aria-required");
  });

  it("associates a server validation error with its field and focuses it", async () => {
    vi.mocked(createCard).mockResolvedValueOnce({
      fields: {
        "intermediatePhrases.2": ["Фраза не принята сервером"],
      },
      message: "Проверьте заполненные поля",
      ok: false,
    });
    const user = userEvent.setup();
    renderWithIntl(<CardCreatorForm locale="ru" />);

    await user.click(
      screen.getByRole("button", { name: "Создать личную ссылку" }),
    );

    const phrase = screen.getByLabelText("После замка 3");
    expect(
      await screen.findByText("Фраза не принята сервером"),
    ).toHaveAttribute("id", "intermediate-2-error");
    expect(phrase).toHaveAttribute("aria-invalid", "true");
    expect(phrase).toHaveFocus();
  });

  it("hands an edited draft to the next locale without translating it", async () => {
    const user = userEvent.setup();
    renderWithIntl(<CardCreatorForm locale="en" />, "en");

    await user.clear(screen.getByLabelText("Your name"));
    await user.type(screen.getByLabelText("Your name"), "Kept exactly");
    await user.selectOptions(screen.getByLabelText("Language"), "uk");

    expect(replaceLocale).toHaveBeenCalledWith("/create", { locale: "uk" });
    expect(
      JSON.parse(
        window.sessionStorage.getItem("unseal:create-locale-draft") ?? "{}",
      ),
    ).toMatchObject({
      senderName: "Kept exactly",
    });
  });

  it("keeps restored edits dirty while replacing untouched template fields", async () => {
    window.sessionStorage.setItem(
      "unseal:create-locale-draft",
      JSON.stringify({ senderName: "Kept exactly" }),
    );
    const user = userEvent.setup();
    renderWithIntl(<CardCreatorForm locale="uk" />, "uk");

    expect(
      await screen.findByDisplayValue("Kept exactly"),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Початкова фраза")).toHaveValue(
      getDefaultCard("uk").introPhrase,
    );

    await user.selectOptions(screen.getByLabelText("Мова"), "en");

    expect(
      JSON.parse(
        window.sessionStorage.getItem("unseal:create-locale-draft") ?? "{}",
      ),
    ).toEqual({ senderName: "Kept exactly" });
  });
});
