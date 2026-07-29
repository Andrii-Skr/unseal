"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useState,
} from "react";
import { Volume2, VolumeX } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  motion,
  MotionConfig,
} from "motion/react";
import { FinalMessage } from "@/components/final-message";
import { HeartScene } from "@/components/heart-scene";
import { HeartZoomTransition } from "@/components/heart-zoom-transition";
import {
  InsideHeartScene,
  InsideHeartScenePreload,
} from "@/components/inside-heart-scene";
import { MessageStep } from "@/components/message-step";
import { Button } from "@/components/ui/button";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import { useRomanticAudio } from "@/hooks/use-romantic-audio";
import type { CardInput } from "@/lib/card-schema";
import {
  openedLockCount,
  stageAfterOpening,
  type CardStage,
} from "@/lib/card-stages";

type CardExperienceProps = {
  card: CardInput;
};

const INSIDE_READING_DURATION_MS = 2800;

function getMessage(card: CardInput, stage: CardStage) {
  if (stage === "intro") return card.introPhrase;

  const index = [
    "lock-1-opened",
    "lock-2-opened",
    "lock-3-opened",
    "lock-4-opened",
  ].indexOf(stage);

  if (index >= 0) return card.intermediatePhrases[index];
  return card.preHeartPhrase;
}

export function CardExperience({ card }: CardExperienceProps) {
  return (
    <MotionConfig reducedMotion="never">
      <CardExperienceContent card={card} />
    </MotionConfig>
  );
}

function CardExperienceContent({ card }: CardExperienceProps) {
  const t = useTranslations("Card");
  const commonT = useTranslations("Common");
  const reduceMotion = usePrefersReducedMotion();
  const [stage, setStage] = useState<CardStage>("intro");
  const [openingLockIndex, setOpeningLockIndex] = useState<number | null>(null);
  const {
    enabled,
    playFinalMusic,
    playLock,
    playTransition,
    prepareFinalMusic,
    stopFinalMusic,
    toggle,
  } = useRomanticAudio(card.soundEnabled);
  const openedCount = openedLockCount(stage);
  const isOpeningFinalLock = openingLockIndex === 4;
  const isEnteringHeart = stage === "entering-heart";
  const isHeartOpen =
    stage === "all-locks-opened" || isEnteringHeart;
  const showInsideScene =
    stage === "inside-heart" ||
    stage === "final-message";
  const showPaperScene =
    stage !== "inside-heart" && stage !== "final-message";
  const buttonLabels = [
    t("button1"),
    t("button2"),
    t("button3"),
    t("button4"),
    t("button5"),
  ];
  const stageAnnouncement =
    stage === "entering-heart"
      ? t("openingHeart")
      : stage === "inside-heart"
        ? t("insideAnnouncement")
        : stage === "final-message"
          ? t("finalAnnouncement")
          : getMessage(card, stage);

  useLayoutEffect(() => {
    const previousLanguage = document.documentElement.lang;
    document.documentElement.lang = card.language;
    const previousScrollRestoration = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });

    return () => {
      window.history.scrollRestoration = previousScrollRestoration;
      document.documentElement.lang = previousLanguage;
    };
  }, [card.language]);

  useEffect(() => {
    if (stage !== "inside-heart") return;
    const timer = window.setTimeout(
      () => setStage("final-message"),
      INSIDE_READING_DURATION_MS,
    );
    return () => window.clearTimeout(timer);
  }, [stage]);

  useEffect(() => {
    if (stage === "final-message") playFinalMusic();
  }, [playFinalMusic, stage]);

  const openNextLock = useCallback(() => {
    if (openingLockIndex !== null || openedCount >= 5) return;
    const lockIndex = openedCount;
    setOpeningLockIndex(lockIndex);
    playLock();

    window.setTimeout(
      () => {
        setStage(stageAfterOpening(lockIndex));
        setOpeningLockIndex(null);
      },
      reduceMotion ? 150 : 900,
    );
  }, [openedCount, openingLockIndex, playLock, reduceMotion]);

  const enterHeart = useCallback(() => {
    prepareFinalMusic();
    playTransition();
    setStage("entering-heart");
  }, [playTransition, prepareFinalMusic]);

  const completeHeartEntry = useCallback(() => {
    setStage((currentStage) =>
      currentStage === "entering-heart"
        ? "inside-heart"
        : currentStage,
    );
  }, []);

  const replay = useCallback(() => {
    stopFinalMusic();
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    setOpeningLockIndex(null);
    setStage("intro");
  }, [stopFinalMusic]);

  return (
    <>
      <h1 className="sr-only" lang={card.language}>
        {t("heading", { name: card.recipientName })}
      </h1>
      <p
        aria-atomic="true"
        aria-live="polite"
        className="sr-only"
        role="status"
      >
        {stageAnnouncement}
      </p>
      {showInsideScene ? (
        <InsideHeartScene locale={card.language}>
          {stage === "inside-heart" ? (
            <motion.p
              animate={{ opacity: 1 }}
              className="mx-auto flex min-h-svh max-w-lg items-center px-8 pb-[45svh] text-center font-heading text-4xl leading-tight text-white drop-shadow-sm"
              initial={{ opacity: 0 }}
              transition={{ duration: reduceMotion ? 0.15 : 0.6 }}
            >
              {t("insideAnnouncement")}
            </motion.p>
          ) : (
            <FinalMessage card={card} onReplay={replay} />
          )}
        </InsideHeartScene>
      ) : null}
      {showPaperScene ? (
        <main
          className="paper-surface relative z-20 flex min-h-svh flex-col overflow-hidden"
          lang={card.language}
        >
          {isHeartOpen ? <InsideHeartScenePreload /> : null}
          <header className="relative z-20 flex items-start justify-between px-5 pb-2 pt-5 sm:px-8">
            <div>
              <p className="font-heading text-3xl font-semibold tracking-tight text-[var(--ink)]">
                Unseal
              </p>
              <p className="hidden text-xs text-[var(--ink-soft)] sm:block">
                {commonT("brandTagline")}
              </p>
            </div>
            {card.soundEnabled ? (
              <Button
                aria-label={enabled ? t("soundOff") : t("soundOn")}
                aria-pressed={enabled}
                className="size-11 rounded-full border-[var(--rose-deep)]/20 bg-white/50 text-[var(--rose-deep)] hover:bg-white/80"
                onClick={toggle}
                size="icon"
                variant="outline"
              >
                {enabled ? <Volume2 /> : <VolumeX />}
              </Button>
            ) : null}
          </header>

          <div className="relative z-10 flex flex-1 flex-col items-center justify-center gap-4 pb-7 lg:grid lg:w-full lg:grid-cols-2 lg:items-center lg:gap-10 lg:px-10 lg:pb-4">
            <HeartZoomTransition
              active={isEnteringHeart}
              onComplete={completeHeartEntry}
            >
              <HeartScene
                loosened={isHeartOpen}
                openedCount={openedCount}
                openingLockIndex={openingLockIndex}
              />
            </HeartZoomTransition>
            <div
              className="grid min-h-48 w-full shrink-0 place-items-center lg:min-h-0"
              data-testid="message-region"
            >
              <div
                className={
                  isOpeningFinalLock
                    ? "pointer-events-none w-full opacity-0"
                    : "w-full opacity-100"
                }
                data-testid="message-content"
              >
                <MessageStep
                  buttonLabel={
                    isHeartOpen
                      ? t("enter")
                      : buttonLabels[openedCount]
                  }
                  disabled={
                    openingLockIndex !== null || isEnteringHeart
                  }
                  message={getMessage(card, stage)}
                  onContinue={
                    isHeartOpen ? enterHeart : openNextLock
                  }
                />
              </div>
            </div>
          </div>

          <p className="relative z-10 pb-4 text-center text-xs text-[var(--ink-soft)]/75">
            {t("forRecipient", { name: card.recipientName })}
          </p>
        </main>
      ) : null}
    </>
  );
}
