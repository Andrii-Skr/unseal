import { describe, expect, it } from "vitest";
import { createCard } from "@/app/actions";
import { DEFAULT_CARD } from "@/lib/card-schema";

describe("createCard", () => {
  it("returns exact paths for nested validation errors", async () => {
    const result = await createCard({
      ...DEFAULT_CARD,
      intermediatePhrases: [
        DEFAULT_CARD.intermediatePhrases[0],
        DEFAULT_CARD.intermediatePhrases[1],
        "",
        DEFAULT_CARD.intermediatePhrases[3],
      ],
    });

    expect(result).toMatchObject({
      fields: {
        "intermediatePhrases.2": ["Добавьте фразу"],
      },
      message: "Проверьте заполненные поля",
      ok: false,
    });
  });
});
