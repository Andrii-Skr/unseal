import { z } from "zod";
import { getMessagesForLocale } from "@/i18n/messages";
import {
  isAppLocale,
  routing,
  type AppLocale,
} from "@/i18n/routing";

const languageSchema = z.enum(routing.locales);

function formatCount(template: string, count: number) {
  return template.replace("{count}", String(count));
}

export function createCardInputSchema(locale: AppLocale) {
  const validation = getMessagesForLocale(locale).Validation;
  const safeReplyUrl = z
    .string()
    .max(500, validation.replyTooLong)
    .refine((value) => {
      if (value === "") return true;

      try {
        const protocol = new URL(value).protocol;
        return protocol === "https:" || protocol === "mailto:";
      } catch {
        return false;
      }
    }, validation.replyInvalid);

  return z.object({
    language: languageSchema,
    senderName: z
      .string()
      .trim()
      .min(1, validation.senderRequired)
      .max(80, validation.nameTooLong),
    recipientName: z
      .string()
      .trim()
      .min(1, validation.recipientRequired)
      .max(80, validation.nameTooLong),
    introPhrase: z
      .string()
      .trim()
      .min(1, validation.introRequired)
      .max(320, formatCount(validation.tooLong, 320)),
    intermediatePhrases: z.tuple([
      z
        .string()
        .trim()
        .min(1, validation.phraseRequired)
        .max(320, formatCount(validation.tooLong, 320)),
      z
        .string()
        .trim()
        .min(1, validation.phraseRequired)
        .max(320, formatCount(validation.tooLong, 320)),
      z
        .string()
        .trim()
        .min(1, validation.phraseRequired)
        .max(320, formatCount(validation.tooLong, 320)),
      z
        .string()
        .trim()
        .min(1, validation.phraseRequired)
        .max(320, formatCount(validation.tooLong, 320)),
    ]),
    preHeartPhrase: z
      .string()
      .trim()
      .min(1, validation.preHeartRequired)
      .max(240, formatCount(validation.tooLong, 240)),
    finalMessage: z
      .string()
      .trim()
      .min(1, validation.finalRequired)
      .max(6000, formatCount(validation.tooLong, 6000)),
    signature: z
      .string()
      .trim()
      .max(500, formatCount(validation.tooLong, 500)),
    soundEnabled: z.boolean(),
    replyUrl: safeReplyUrl,
  });
}

export const cardInputSchema = createCardInputSchema("ru");
export type CardInput = z.infer<typeof cardInputSchema>;

const DEFAULT_FINAL_MESSAGES: Record<AppLocale, string> = {
  ru: `Теперь между тобой и моими чувствами не осталось ни одного замка.

Есть только искренние слова, немного нежности и человек, которому хочется быть ближе к тебе — даже когда между вами расстояние.

Я не прошу невозможного лишь не скрывай
Ту, что прячется где-то за нежностью твоих очей
Если сердцу захочется просто позволь
Стать чуть ближе хотя бы на миг

Не красота меня манит — она и так есть,
И её невозможно ничем превзойти.
Мне дороже, когда ты решишься сама
Без опаски навстречу немного пойти

Ведь важнее признаний и громких речей
Лишь краткий миг, где не нужно играть никого.
Где ты просто остаешься собой классной такой
И прекраснее этого чуда пожалуй что нет`,
  en: `Now there are no locks left between you and my feelings.

Only honest words, a little tenderness, and someone who wants to be closer to you — even when distance stands between us.

I ask for nothing impossible, only this:
Do not hide the light behind your eyes.
If your heart feels ready, let us become
A little closer, even for a moment.

Beauty is not what draws me — it is already there,
And nothing could ever outshine it.
What matters more is the moment you choose
To take one fearless step toward me.

More precious than promises or eloquent words
Is a quiet moment when neither of us has to pretend.
When you can simply be your wonderful self,
And nothing could be more beautiful than that.`,
  uk: `Тепер між тобою і моїми почуттями не залишилося жодного замка.

Є лише щирі слова, трохи ніжності й людина, яка хоче бути ближче до тебе — навіть коли між нами відстань.

Я не прошу неможливого — лише не ховай
Те світло, що живе у глибині твоїх очей.
Якщо серце захоче, просто дозволь
Стати трохи ближчими хоча б на мить.

Не краса мене вабить — вона вже є,
І ніщо не зможе її перевершити.
Мені дорожче мить, коли ти наважишся
Без страху зробити маленький крок назустріч.

Адже важливіше за зізнання й гучні слова
Лише коротка мить, коли не треба нікого вдавати.
Коли ти просто залишаєшся собою,
І прекраснішого дива, мабуть, не існує.`,
};

const DEFAULT_CARDS: Record<AppLocale, CardInput> = {
  ru: {
    language: "ru",
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
    finalMessage: DEFAULT_FINAL_MESSAGES.ru,
    signature: "Для тебя, Анна.\nС теплом, Алексей",
    soundEnabled: true,
    replyUrl: "",
  },
  en: {
    language: "en",
    senderName: "Alex",
    recipientName: "Anna",
    introPhrase:
      "Behind these locks is something that cannot be touched by hand",
    intermediatePhrases: [
      "There is no gift inside",
      "No jewels or grand promises",
      "Only feelings that stayed unspoken for far too long",
      "And someone who understands more each day how lucky they were to meet you",
    ],
    preHeartPhrase:
      "Now you can look into the place where my feelings have been living",
    finalMessage: DEFAULT_FINAL_MESSAGES.en,
    signature: "For you, Anna.\nWith warmth, Alex",
    soundEnabled: true,
    replyUrl: "",
  },
  uk: {
    language: "uk",
    senderName: "Олексій",
    recipientName: "Анна",
    introPhrase:
      "За цими замками заховано те, чого не можна торкнутися руками",
    intermediatePhrases: [
      "Там немає подарунка",
      "Немає коштовностей і гучних обіцянок",
      "Там лише почуття, які надто довго залишалися невисловленими",
      "І людина, яка щодня дедалі більше розуміє, як їй пощастило зустріти тебе",
    ],
    preHeartPhrase:
      "Тепер можна зазирнути туди, де весь цей час жили мої почуття",
    finalMessage: DEFAULT_FINAL_MESSAGES.uk,
    signature: "Для тебе, Анно.\nЗ теплом, Олексій",
    soundEnabled: true,
    replyUrl: "",
  },
};

export const DEFAULT_FINAL_MESSAGE = DEFAULT_FINAL_MESSAGES.ru;
export const DEFAULT_CARD = DEFAULT_CARDS.ru;

export function getDefaultCard(locale: AppLocale): CardInput {
  const card = DEFAULT_CARDS[locale];
  return {
    ...card,
    intermediatePhrases: [...card.intermediatePhrases],
  };
}

export function resolveCardLocale(value: unknown): AppLocale {
  return isAppLocale(value) ? value : routing.defaultLocale;
}

export function makeSignature(
  recipientName: string,
  senderName: string,
  locale: AppLocale = "ru",
) {
  if (locale === "en") {
    return `For ${recipientName || "you"}.\nWith warmth, ${
      senderName || "someone whose heart is close"
    }`;
  }
  if (locale === "uk") {
    return `Для тебе, ${recipientName || "тебе"}.\nЗ теплом, ${
      senderName || "той, хто поруч серцем"
    }`;
  }
  return `Для тебя, ${recipientName || "тебя"}.\nС теплом, ${
    senderName || "тот, кто рядом сердцем"
  }`;
}
