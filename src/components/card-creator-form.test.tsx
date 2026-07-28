// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createCard } from "@/app/actions";
import { CardCreatorForm } from "@/components/card-creator-form";

vi.mock("@/app/actions", () => ({
  createCard: vi.fn(),
}));

afterEach(() => {
  vi.resetAllMocks();
});

describe("CardCreatorForm", () => {
  it("associates a validation error with its field", async () => {
    const user = userEvent.setup();
    render(<CardCreatorForm />);
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
    render(<CardCreatorForm />);

    const soundSwitch = screen.getByRole("switch", {
      name: "Звуки истории",
    });
    expect(soundSwitch).toHaveAccessibleDescription(
      "Колокольчик прозвучит только после нажатия на замок; получатель сможет выключить его.",
    );
  });

  it("marks required fields programmatically", () => {
    render(<CardCreatorForm />);

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
    render(<CardCreatorForm />);

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
});
