// @vitest-environment jsdom

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CardPreview } from "@/components/card-preview";
import { DEFAULT_CARD } from "@/lib/card-schema";

describe("CardPreview", () => {
  it("shows each selected lock state without mutating card content", () => {
    render(<CardPreview card={DEFAULT_CARD} />);

    expect(
      screen.getByRole("group", { name: "Этап предпросмотра" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Начало" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByText(DEFAULT_CARD.introPhrase)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "3 замка" }));
    expect(screen.getByRole("button", { name: "Начало" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    expect(screen.getByRole("button", { name: "3 замка" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(
      screen.getByText(DEFAULT_CARD.intermediatePhrases[2]),
    ).toBeInTheDocument();
    expect(screen.getByTestId("lock-layer").children).toHaveLength(5);
  });

  it("renders the final message preview", () => {
    render(<CardPreview card={DEFAULT_CARD} />);
    fireEvent.click(screen.getByRole("button", { name: "Финал" }));

    const panel = screen.getByTestId("final-message-panel");
    expect(panel).toHaveTextContent(
      "Теперь между тобой и моими чувствами не осталось ни одного замка",
    );
    expect(
      panel.querySelector("[data-poem-block='true']"),
    ).not.toHaveClass("hidden");
    expect(
      screen.getByAltText(
        "Силуэт человека в худи смотрит на тёплый свет вдали",
      ),
    ).toHaveAttribute("sizes", "(min-width: 1024px) 45vw, 100vw");
  });

  it("does not mount the heavy keepsake until download is requested", () => {
    render(
      <CardPreview
        card={{
          ...DEFAULT_CARD,
          finalMessage:
            "Это наш собственный заголовок\n\nИ продолжение личной истории.",
        }}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Финал" }));

    expect(screen.queryByTestId("keepsake-content")).not.toBeInTheDocument();
  });

  it("hides the removed paragraph in legacy default cards", () => {
    render(
      <CardPreview
        card={{
          ...DEFAULT_CARD,
          finalMessage: DEFAULT_CARD.finalMessage.replace(
            "\n\nЕсть только",
            "\n\nЗдесь нет подарков и драгоценностей.\n\nЕсть только",
          ),
        }}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Финал" }));

    expect(
      screen.queryByText("Здесь нет подарков и драгоценностей."),
    ).not.toBeInTheDocument();
  });
});
