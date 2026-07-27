import { z } from "zod";

const safeReplyUrl = z
  .string()
  .max(500, "Ссылка слишком длинная")
  .refine((value) => {
    if (value === "") return true;

    try {
      const protocol = new URL(value).protocol;
      return protocol === "https:" || protocol === "mailto:";
    } catch {
      return false;
    }
  }, "Используйте ссылку https://… или mailto:…");

export const cardInputSchema = z.object({
  senderName: z
    .string()
    .trim()
    .min(1, "Укажите имя отправителя")
    .max(80, "Не более 80 символов"),
  recipientName: z
    .string()
    .trim()
    .min(1, "Укажите имя получателя")
    .max(80, "Не более 80 символов"),
  introPhrase: z
    .string()
    .trim()
    .min(1, "Добавьте начальную фразу")
    .max(320, "Не более 320 символов"),
  intermediatePhrases: z.tuple([
    z.string().trim().min(1, "Добавьте фразу").max(320),
    z.string().trim().min(1, "Добавьте фразу").max(320),
    z.string().trim().min(1, "Добавьте фразу").max(320),
    z.string().trim().min(1, "Добавьте фразу").max(320),
  ]),
  preHeartPhrase: z
    .string()
    .trim()
    .min(1, "Добавьте фразу перед переходом")
    .max(240, "Не более 240 символов"),
  finalMessage: z
    .string()
    .trim()
    .min(1, "Добавьте финальное послание")
    .max(6000, "Не более 6000 символов"),
  signature: z
    .string()
    .trim()
    .max(500, "Не более 500 символов"),
  soundEnabled: z.boolean(),
  replyUrl: safeReplyUrl,
});

export type CardInput = z.infer<typeof cardInputSchema>;

export const DEFAULT_FINAL_MESSAGE = `Теперь между тобой и моими чувствами не осталось ни одного замка.

Есть только искренние слова, немного нежности и человек, которому хочется быть ближе к тебе — даже когда между вами расстояние.

Я не прошу невозможного — лишь не скрывай
Ту, что прячется где-то за нежностью очей.
Если сердцу захочется — просто позволь
Стать чуть ближе хотя бы на миг.

Не красота меня манит — она и так есть,
И её невозможно ничем превзойти.
Мне дороже, когда ты решишься сама
Без опаски навстречу немного пойти.

Ведь важнее признаний и громких речей
Лишь краткий миг, где не нужно играть никого.
Где ты просто остаешься собой — классной такой
И прекраснее этого чуда пожалуй нет.`;

export const DEFAULT_CARD: CardInput = {
  senderName: "Алексей",
  recipientName: "Анна",
  introPhrase:
    "За этими замками спрятано то, чего нельзя коснуться руками",
  intermediatePhrases: [
    "Там нет подарка",
    "Нет драгоценностей и громких обещаний",
    "Там лишь чувства, которые слишком долго оставались несказанными",
    "И человек, который с каждым днём всё сильнее понимает, как ему повезло встретить тебя",
  ],
  preHeartPhrase:
    "Теперь можно заглянуть туда, где всё это время жили мои чувства",
  finalMessage: DEFAULT_FINAL_MESSAGE,
  signature: "Для тебя, Анна.\nС теплом, Алексей",
  soundEnabled: true,
  replyUrl: "",
};

export function makeSignature(recipientName: string, senderName: string) {
  return `Для тебя, ${recipientName || "тебя"}.\nС теплом, ${
    senderName || "тот, кто рядом сердцем"
  }`;
}
