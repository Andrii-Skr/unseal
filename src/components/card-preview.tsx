"use client";

import { useState } from "react";
import { MotionConfig } from "motion/react";
import { FinalMessage } from "@/components/final-message";
import { HeartScene } from "@/components/heart-scene";
import { InsideHeartScene } from "@/components/inside-heart-scene";
import { MessageStep } from "@/components/message-step";
import type { CardInput } from "@/lib/card-schema";
import {
  openedLockCount,
  PREVIEW_STAGES,
  type CardStage,
} from "@/lib/card-stages";
import { cn } from "@/lib/utils";

type CardPreviewProps = {
  card: CardInput;
  className?: string;
};

function previewMessage(card: CardInput, stage: CardStage) {
  if (stage === "intro") return card.introPhrase;
  const messageIndex = [
    "lock-1-opened",
    "lock-2-opened",
    "lock-3-opened",
    "lock-4-opened",
  ].indexOf(stage);

  if (messageIndex >= 0) return card.intermediatePhrases[messageIndex];
  return card.preHeartPhrase;
}

export function CardPreview({ card, className }: CardPreviewProps) {
  return (
    <MotionConfig reducedMotion="never">
      <CardPreviewContent card={card} className={className} />
    </MotionConfig>
  );
}

function CardPreviewContent({ card, className }: CardPreviewProps) {
  const [stage, setStage] = useState<CardStage>("intro");
  const inside = stage === "inside-heart" || stage === "final-message";

  return (
    <section className={cn("flex min-h-0 flex-col", className)}>
      <div
        aria-label="Этап предпросмотра"
        className="scrollbar-soft mb-3 flex gap-1.5 overflow-x-auto pb-1"
        role="group"
      >
        {PREVIEW_STAGES.map((item) => (
          <button
            aria-pressed={stage === item.value}
            className={cn(
              "min-h-9 shrink-0 rounded-full border px-3 text-xs transition",
              stage === item.value
                ? "border-[var(--rose-deep)] bg-[var(--rose-deep)] text-white"
                : "border-[var(--rose-deep)]/20 bg-white/45 text-[var(--ink-soft)] hover:bg-white/75",
            )}
            key={item.value}
            onClick={() => setStage(item.value)}
            type="button"
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="paper-surface relative min-h-0 flex-1 overflow-hidden rounded-[1.8rem] border border-[var(--rose-deep)]/15 shadow-[0_18px_55px_rgba(109,67,80,.14)]">
        {inside ? (
          <InsideHeartScene compact>
            {stage === "final-message" ? (
              <FinalMessage card={card} compact preview />
            ) : (
              <p className="flex h-full min-h-[32rem] items-center justify-center px-8 pb-44 text-center font-heading text-4xl text-white">
                Теперь ты внутри
              </p>
            )}
          </InsideHeartScene>
        ) : (
          <div className="flex min-h-[32rem] flex-col items-center justify-center px-4 pb-6 pt-2">
            <HeartScene
              compact
              loosened={stage === "all-locks-opened"}
              openedCount={openedLockCount(stage)}
            />
            <MessageStep
              compact
              message={previewMessage(card, stage)}
            />
          </div>
        )}
      </div>
    </section>
  );
}
