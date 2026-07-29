"use client";

import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, Heart, LockKeyhole, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  Controller,
  useForm,
  useWatch,
  type FieldError,
  type FieldPath,
} from "react-hook-form";
import { createCard } from "@/app/actions";
import { CardPreview } from "@/components/card-preview";
import { ShareCardDialog } from "@/components/share-card-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  createCardInputSchema,
  getDefaultCard,
  makeSignature,
  type CardInput,
} from "@/lib/card-schema";
import { usePathname, useRouter } from "@/i18n/navigation";
import {
  isAppLocale,
  routing,
  type AppLocale,
} from "@/i18n/routing";

const CREATE_DRAFT_KEY = "unseal:create-locale-draft";
const TEXT_FIELD_NAMES = [
  "senderName",
  "recipientName",
  "introPhrase",
  "preHeartPhrase",
  "finalMessage",
  "signature",
  "replyUrl",
] as const;
const INTERMEDIATE_PATHS = [
  "intermediatePhrases.0",
  "intermediatePhrases.1",
  "intermediatePhrases.2",
  "intermediatePhrases.3",
] as const;

type CardDirtyFields = Partial<
  Record<(typeof TEXT_FIELD_NAMES)[number] | "soundEnabled", boolean>
> & {
  intermediatePhrases?: readonly (boolean | undefined)[];
};

type CardLocaleDraft = Partial<
  Pick<
    CardInput,
    (typeof TEXT_FIELD_NAMES)[number] | "soundEnabled"
  >
> & {
  intermediatePhrases?: Array<string | null>;
};

function createLocaleDraft(
  values: CardInput,
  dirtyFields: CardDirtyFields,
): CardLocaleDraft {
  const draft: CardLocaleDraft = {};
  const draftRecord = draft as Record<string, unknown>;
  const valuesRecord = values as unknown as Record<string, unknown>;

  for (const field of TEXT_FIELD_NAMES) {
    if (dirtyFields[field]) {
      draftRecord[field] = valuesRecord[field];
    }
  }

  if (dirtyFields.soundEnabled) {
    draft.soundEnabled = values.soundEnabled;
  }

  const intermediatePhrases = values.intermediatePhrases.map(
    (phrase, index) =>
      dirtyFields.intermediatePhrases?.[index] ? phrase : null,
  );
  if (intermediatePhrases.some((phrase) => phrase !== null)) {
    draft.intermediatePhrases = intermediatePhrases;
  }

  return draft;
}

function restoreLocaleDraft(
  value: unknown,
  defaultCard: CardInput,
): { card: CardInput; signatureEdited: boolean } | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const draft = value as Record<string, unknown>;
  const card: CardInput = {
    ...defaultCard,
    intermediatePhrases: [...defaultCard.intermediatePhrases],
  };
  const cardRecord = card as unknown as Record<string, unknown>;

  for (const field of TEXT_FIELD_NAMES) {
    if (typeof draft[field] === "string") {
      cardRecord[field] = draft[field];
    }
  }

  if (typeof draft.soundEnabled === "boolean") {
    card.soundEnabled = draft.soundEnabled;
  }

  const intermediateDraft = draft.intermediatePhrases;
  if (Array.isArray(intermediateDraft)) {
    card.intermediatePhrases = card.intermediatePhrases.map(
      (phrase, index) =>
        typeof intermediateDraft[index] === "string"
          ? intermediateDraft[index]
          : phrase,
    ) as CardInput["intermediatePhrases"];
  }

  return {
    card,
    signatureEdited: typeof draft.signature === "string",
  };
}

const CARD_FIELD_PATHS = new Set<string>([
  "senderName",
  "recipientName",
  "introPhrase",
  ...INTERMEDIATE_PATHS,
  "preHeartPhrase",
  "finalMessage",
  "signature",
  "soundEnabled",
  "replyUrl",
]);

function isCardFieldPath(value: string): value is FieldPath<CardInput> {
  return CARD_FIELD_PATHS.has(value);
}

function ErrorText({ error, id }: { error?: FieldError; id: string }) {
  return error ? (
    <p
      className="mt-1 text-xs text-destructive"
      id={id}
      role="alert"
    >
      {error.message}
    </p>
  ) : null;
}

function SectionTitle({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex items-center gap-3">
      <span className="grid size-9 place-items-center rounded-full bg-[var(--blush)]/35 text-[var(--rose-deep)]">
        {icon}
      </span>
      <h2 className="font-heading text-2xl font-semibold text-[var(--ink)]">
        {children}
      </h2>
    </div>
  );
}

type CardCreatorFormProps = {
  locale: AppLocale;
};

export function CardCreatorForm({ locale }: CardCreatorFormProps) {
  const t = useTranslations("Creator");
  const languageT = useTranslations("Language");
  const commonT = useTranslations("Common");
  const pathname = usePathname();
  const router = useRouter();
  const defaultCard = useMemo(() => getDefaultCard(locale), [locale]);
  const signatureEdited = useRef(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const {
    control,
    formState: { dirtyFields, errors, isDirty },
    getValues,
    handleSubmit,
    register,
    reset,
    setError,
    setValue,
  } = useForm<CardInput>({
    defaultValues: defaultCard,
    resolver: zodResolver(createCardInputSchema(locale)),
    mode: "onBlur",
  });

  const values = useWatch({ control });
  const senderName = useWatch({ control, name: "senderName" });
  const recipientName = useWatch({ control, name: "recipientName" });
  const deferredValues = useDeferredValue(values);

  useEffect(() => {
    const savedDraft = window.sessionStorage.getItem(CREATE_DRAFT_KEY);
    if (!savedDraft) return;
    window.sessionStorage.removeItem(CREATE_DRAFT_KEY);

    try {
      const restored = restoreLocaleDraft(
        JSON.parse(savedDraft),
        defaultCard,
      );
      if (!restored) return;
      signatureEdited.current = restored.signatureEdited;
      reset(restored.card, { keepDefaultValues: true });
    } catch {
      // Ignore an invalid or stale one-time draft.
    }
  }, [defaultCard, reset]);

  useEffect(() => {
    if (!signatureEdited.current) {
      setValue("signature", makeSignature(recipientName, senderName, locale), {
        shouldDirty: false,
      });
    }
  }, [locale, recipientName, senderName, setValue]);

  const previewCard = useMemo<CardInput>(
    () => ({
      ...defaultCard,
      ...deferredValues,
      intermediatePhrases: [
        deferredValues.intermediatePhrases?.[0] ??
          defaultCard.intermediatePhrases[0],
        deferredValues.intermediatePhrases?.[1] ??
          defaultCard.intermediatePhrases[1],
        deferredValues.intermediatePhrases?.[2] ??
          defaultCard.intermediatePhrases[2],
        deferredValues.intermediatePhrases?.[3] ??
          defaultCard.intermediatePhrases[3],
      ],
      replyUrl: deferredValues.replyUrl ?? "",
    }),
    [defaultCard, deferredValues],
  );

  const signatureField = register("signature");

  function changeLocale(nextLocale: string) {
    if (!isAppLocale(nextLocale) || nextLocale === locale) return;
    if (isDirty) {
      window.sessionStorage.setItem(
        CREATE_DRAFT_KEY,
        JSON.stringify(
          createLocaleDraft(getValues(), dirtyFields as CardDirtyFields),
        ),
      );
    } else {
      window.sessionStorage.removeItem(CREATE_DRAFT_KEY);
    }
    router.replace(pathname, { locale: nextLocale });
  }

  const onSubmit = handleSubmit(async (data) => {
    setSubmitting(true);
    setServerError("");

    try {
      const result = await createCard(data);

      if (!result.ok) {
        setServerError(result.message);
        let shouldFocus = true;
        for (const [field, messages] of Object.entries(result.fields ?? {})) {
          const message = messages[0];
          if (!message || !isCardFieldPath(field)) continue;

          setError(
            field,
            { message, type: "server" },
            { shouldFocus },
          );
          shouldFocus = false;
        }
        return;
      }

      const url = new URL(`/card/${result.token}`, window.location.origin);
      setShareUrl(url.toString());
      setShareOpen(true);
    } catch {
      setServerError(
        t("connectionError"),
      );
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <main className="paper-surface min-h-svh">
      <header className="mx-auto flex max-w-[92rem] items-end justify-between px-5 pb-8 pt-7 sm:px-8 lg:px-10">
        <div>
          <h1 className="font-heading text-5xl font-semibold tracking-[-0.04em] text-[var(--ink)] sm:text-6xl">
            Unseal
          </h1>
          <p className="mt-1 max-w-md text-sm leading-6 text-[var(--ink-soft)]">
            {commonT("brandTagline")}
          </p>
        </div>
        <div className="flex flex-col items-end gap-3">
          <label className="flex items-center gap-2 text-xs text-[var(--ink-soft)]">
            <span>{languageT("label")}</span>
            <select
              aria-label={languageT("label")}
              className="romantic-input h-9 rounded-full px-3"
              onChange={(event) => changeLocale(event.target.value)}
              value={locale}
            >
              {routing.locales.map((item) => (
                <option key={item} value={item}>
                  {languageT(item)}
                </option>
              ))}
            </select>
          </label>
          <p className="hidden max-w-xs text-right text-xs leading-5 text-[var(--ink-soft)] lg:block">
            {t("expiryNote")}
          </p>
        </div>
      </header>

      <div className="mx-auto grid max-w-[92rem] gap-10 px-5 pb-28 sm:px-8 lg:grid-cols-[minmax(0,1fr)_minmax(28rem,.86fr)] lg:px-10">
        <form
          className="min-w-0 space-y-10"
          onSubmit={onSubmit}
          suppressHydrationWarning
        >
          <section>
            <SectionTitle icon={<Heart className="size-4" />}>
              {t("storySection")}
            </SectionTitle>
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <Label htmlFor="senderName">{t("senderName")}</Label>
                <Input
                  aria-describedby={
                    errors.senderName ? "senderName-error" : undefined
                  }
                  aria-invalid={Boolean(errors.senderName)}
                  aria-required="true"
                  className="romantic-input mt-2 h-11"
                  id="senderName"
                  maxLength={80}
                  {...register("senderName")}
                />
                <ErrorText error={errors.senderName} id="senderName-error" />
              </div>
              <div>
                <Label htmlFor="recipientName">{t("recipientName")}</Label>
                <Input
                  aria-describedby={
                    errors.recipientName ? "recipientName-error" : undefined
                  }
                  aria-invalid={Boolean(errors.recipientName)}
                  aria-required="true"
                  className="romantic-input mt-2 h-11"
                  id="recipientName"
                  maxLength={80}
                  {...register("recipientName")}
                />
                <ErrorText
                  error={errors.recipientName}
                  id="recipientName-error"
                />
              </div>
            </div>
          </section>

          <Separator className="bg-[var(--rose-deep)]/15" />

          <section>
            <SectionTitle icon={<LockKeyhole className="size-4" />}>
              {t("locksSection")}
            </SectionTitle>
            <div className="space-y-5">
              <div>
                <Label htmlFor="introPhrase">{t("introPhrase")}</Label>
                <Textarea
                  aria-describedby={
                    errors.introPhrase ? "introPhrase-error" : undefined
                  }
                  aria-invalid={Boolean(errors.introPhrase)}
                  aria-required="true"
                  className="romantic-input mt-2 min-h-24 resize-y"
                  id="introPhrase"
                  maxLength={320}
                  {...register("introPhrase")}
                />
                <ErrorText error={errors.introPhrase} id="introPhrase-error" />
              </div>

              {defaultCard.intermediatePhrases.map((_, index) => (
                <div key={index}>
                  <Label htmlFor={`intermediate-${index}`}>
                    {t("afterLock", { number: index + 1 })}
                  </Label>
                  <Textarea
                    aria-describedby={
                      errors.intermediatePhrases?.[index]
                        ? `intermediate-${index}-error`
                        : undefined
                    }
                    aria-invalid={Boolean(
                      errors.intermediatePhrases?.[index],
                    )}
                    aria-required="true"
                    className="romantic-input mt-2 min-h-20 resize-y"
                    id={`intermediate-${index}`}
                    maxLength={320}
                    {...register(INTERMEDIATE_PATHS[index])}
                  />
                  <ErrorText
                    error={errors.intermediatePhrases?.[index]}
                    id={`intermediate-${index}-error`}
                  />
                </div>
              ))}

              <div>
                <Label htmlFor="preHeartPhrase">
                  {t("preHeartPhrase")}
                </Label>
                <Textarea
                  aria-describedby={
                    errors.preHeartPhrase ? "preHeartPhrase-error" : undefined
                  }
                  aria-invalid={Boolean(errors.preHeartPhrase)}
                  aria-required="true"
                  className="romantic-input mt-2 min-h-20 resize-y"
                  id="preHeartPhrase"
                  maxLength={240}
                  {...register("preHeartPhrase")}
                />
                <ErrorText
                  error={errors.preHeartPhrase}
                  id="preHeartPhrase-error"
                />
              </div>
            </div>
          </section>

          <Separator className="bg-[var(--rose-deep)]/15" />

          <section>
            <SectionTitle icon={<Sparkles className="size-4" />}>
              {t("insideSection")}
            </SectionTitle>
            <div className="space-y-5">
              <div>
                <Label htmlFor="finalMessage">{t("finalMessage")}</Label>
                <Textarea
                  aria-describedby={
                    errors.finalMessage ? "finalMessage-error" : undefined
                  }
                  aria-invalid={Boolean(errors.finalMessage)}
                  aria-required="true"
                  className="romantic-input mt-2 min-h-80 resize-y leading-6"
                  id="finalMessage"
                  maxLength={6000}
                  {...register("finalMessage")}
                />
                <ErrorText
                  error={errors.finalMessage}
                  id="finalMessage-error"
                />
              </div>
              <div>
                <Label htmlFor="signature">{t("signature")}</Label>
                <Textarea
                  {...signatureField}
                  aria-describedby={
                    errors.signature ? "signature-error" : undefined
                  }
                  aria-invalid={Boolean(errors.signature)}
                  className="romantic-input mt-2 min-h-24 resize-y"
                  id="signature"
                  maxLength={500}
                  placeholder={t("signaturePlaceholder")}
                  onChange={(event) => {
                    signatureEdited.current = true;
                    signatureField.onChange(event);
                  }}
                />
                <ErrorText error={errors.signature} id="signature-error" />
              </div>
              <div>
                <Label htmlFor="replyUrl">{t("replyUrl")}</Label>
                <Input
                  aria-describedby={
                    errors.replyUrl ? "replyUrl-error" : undefined
                  }
                  aria-invalid={Boolean(errors.replyUrl)}
                  className="romantic-input mt-2 h-11"
                  id="replyUrl"
                  maxLength={500}
                  placeholder={t("replyUrlPlaceholder")}
                  {...register("replyUrl")}
                />
                <ErrorText error={errors.replyUrl} id="replyUrl-error" />
              </div>
              <Controller
                control={control}
                name="soundEnabled"
                render={({ field }) => (
                  <div className="flex items-center justify-between gap-6 rounded-2xl border border-[var(--rose-deep)]/15 bg-white/35 px-4 py-4">
                    <div>
                      <Label htmlFor="soundEnabled">{t("sound")}</Label>
                      <p
                        className="mt-1 text-xs leading-5 text-[var(--ink-soft)]"
                        id="soundEnabled-description"
                      >
                        {t("soundDescription")}
                      </p>
                    </div>
                    <Switch
                      checked={field.value}
                      aria-describedby="soundEnabled-description"
                      id="soundEnabled"
                      onCheckedChange={field.onChange}
                    />
                  </div>
                )}
              />
            </div>
          </section>

          {serverError ? (
            <p
              className="rounded-2xl border border-destructive/25 bg-destructive/5 px-4 py-3 text-sm text-destructive"
              role="alert"
            >
              {serverError}
            </p>
          ) : null}

          <Button
            className="romantic-button w-full sm:w-auto"
            disabled={submitting}
            size="lg"
            type="submit"
          >
            <Heart aria-hidden="true" />
            {submitting ? t("submitting") : t("submit")}
          </Button>
        </form>

        <aside className="sticky top-6 hidden h-[calc(100svh-3rem)] min-h-[38rem] lg:block">
          <CardPreview card={previewCard} className="h-full" />
        </aside>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-[var(--rose-deep)]/15 bg-[var(--cream)]/88 p-3 backdrop-blur-md lg:hidden">
        <Button
          className="romantic-button-outline w-full"
          onClick={() => setPreviewOpen(true)}
          size="lg"
          type="button"
          variant="outline"
        >
          <Eye aria-hidden="true" />
          {t("openPreview")}
        </Button>
      </div>

      <Sheet onOpenChange={setPreviewOpen} open={previewOpen}>
        <SheetContent
          className="paper-surface w-full max-w-none border-0 p-0 sm:max-w-none"
          side="bottom"
          style={{
            height: "100dvh",
            maxHeight: "100dvh",
            position: "fixed",
          }}
          closeLabel={commonT("close")}
        >
          <SheetHeader className="pr-12 pt-[max(1rem,env(safe-area-inset-top))]">
            <SheetTitle className="font-heading text-2xl">
              {t("previewTitle")}
            </SheetTitle>
            <SheetDescription>
              {t("previewDescription")}
            </SheetDescription>
          </SheetHeader>
          <CardPreview
            card={previewCard}
            className="min-h-0 flex-1 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
          />
        </SheetContent>
      </Sheet>

      <ShareCardDialog
        onOpenChange={setShareOpen}
        open={shareOpen}
        url={shareUrl}
      />
    </main>
  );
}
