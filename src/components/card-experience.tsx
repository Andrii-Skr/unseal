"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { Volume2, VolumeX } from "lucide-react";
import {
  AnimatePresence,
  motion,
  MotionConfig,
} from "motion/react";
import { FinalMessage } from "@/components/final-message";
import { HeartScene } from "@/components/heart-scene";
import {
  HeartZoomTransition,
  type HeartZoomOrigin,
} from "@/components/heart-zoom-transition";
import { InsideHeartScene } from "@/components/inside-heart-scene";
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

const BUTTON_LABELS = [
  "Открыть первый замок",
  "Продолжить",
  "Ещё один замок",
  "Стать немного ближе",
  "Открыть сердце",
];

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

function getStageAnnouncement(card: CardInput, stage: CardStage) {
  if (stage === "entering-heart") return "Открывается сердце";
  if (stage === "inside-heart") return "Теперь ты внутри";
  if (stage === "final-message") return "Финальное послание";
  return getMessage(card, stage);
}

export function CardExperience({ card }: CardExperienceProps) {
  return (
    <MotionConfig reducedMotion="never">
      <CardExperienceContent card={card} />
    </MotionConfig>
  );
}

function CardExperienceContent({ card }: CardExperienceProps) {
  const reduceMotion = usePrefersReducedMotion();
  const [stage, setStage] = useState<CardStage>("intro");
  const [openingLockIndex, setOpeningLockIndex] = useState<number | null>(null);
  const [heartZoomOrigin, setHeartZoomOrigin] =
    useState<HeartZoomOrigin | null>(null);
  const heartSceneRef = useRef<HTMLDivElement>(null);
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

  useLayoutEffect(() => {
    const previousScrollRestoration = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });

    return () => {
      window.history.scrollRestoration = previousScrollRestoration;
    };
  }, []);

  useEffect(() => {
    if (stage !== "entering-heart") return;
    const timer = window.setTimeout(
      () => setStage("inside-heart"),
      reduceMotion ? 220 : 2200,
    );
    return () => window.clearTimeout(timer);
  }, [reduceMotion, stage]);

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
    const bounds = heartSceneRef.current?.getBoundingClientRect();

    if (bounds) {
      setHeartZoomOrigin({
        height: bounds.height,
        left: bounds.left,
        top: bounds.top,
        width: bounds.width,
      });
    }

    prepareFinalMusic();
    playTransition();
    setStage("entering-heart");
  }, [playTransition, prepareFinalMusic]);

  const replay = useCallback(() => {
    stopFinalMusic();
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    setOpeningLockIndex(null);
    setHeartZoomOrigin(null);
    setStage("intro");
  }, [stopFinalMusic]);

  return (
    <>
      <h1 className="sr-only">Открытка для {card.recipientName}</h1>
      <p
        aria-atomic="true"
        aria-live="polite"
        className="sr-only"
        role="status"
      >
        {getStageAnnouncement(card, stage)}
      </p>
      {stage === "entering-heart" ||
      stage === "inside-heart" ||
      stage === "final-message" ? (
        <InsideHeartScene>
          <AnimatePresence>
            {stage === "entering-heart" ? (
              <HeartZoomTransition origin={heartZoomOrigin} />
            ) : null}
          </AnimatePresence>
          {stage === "entering-heart" ? null : stage === "inside-heart" ? (
            <motion.p
              animate={{ opacity: 1 }}
              className="mx-auto flex min-h-svh max-w-lg items-center px-8 pb-[45svh] text-center font-heading text-4xl leading-tight text-white drop-shadow-sm"
              initial={{ opacity: 0 }}
              transition={{ duration: reduceMotion ? 0.15 : 0.6 }}
            >
              Теперь ты внутри
            </motion.p>
          ) : (
            <FinalMessage card={card} onReplay={replay} />
          )}
        </InsideHeartScene>
      ) : (
        <main className="paper-surface relative flex min-h-svh flex-col overflow-hidden">
          <header className="relative z-20 flex items-start justify-between px-5 pb-2 pt-5 sm:px-8">
            <div>
              <p className="font-heading text-3xl font-semibold tracking-tight text-[var(--ink)]">
                Unseal
              </p>
              <p className="hidden text-xs text-[var(--ink-soft)] sm:block">
                Некоторые чувства стоит открывать не спеша
              </p>
            </div>
            {card.soundEnabled ? (
              <Button
                aria-label={enabled ? "Выключить звук" : "Включить звук"}
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
            <HeartScene
              loosened={stage === "all-locks-opened"}
              openedCount={openedCount}
              openingLockIndex={openingLockIndex}
              sceneRef={heartSceneRef}
            />
            <div
              className="grid min-h-48 w-full shrink-0 place-items-center lg:min-h-0"
              data-testid="message-region"
            >
              <MessageStep
                buttonLabel={
                  stage === "all-locks-opened"
                    ? "Заглянуть внутрь сердца"
                    : BUTTON_LABELS[openedCount]
                }
                disabled={openingLockIndex !== null}
                message={getMessage(card, stage)}
                onContinue={
                  stage === "all-locks-opened" ? enterHeart : openNextLock
                }
              />
            </div>
          </div>

          <p className="relative z-10 pb-4 text-center text-xs text-[var(--ink-soft)]/75">
            Для тебя, {card.recipientName}
          </p>
        </main>
      )}
    </>
  );
}
