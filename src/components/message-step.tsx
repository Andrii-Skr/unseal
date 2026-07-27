"use client";

import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";

type MessageStepProps = {
  message: string;
  buttonLabel?: string;
  onContinue?: () => void;
  disabled?: boolean;
  compact?: boolean;
};

export function MessageStep({
  message,
  buttonLabel,
  onContinue,
  disabled = false,
  compact = false,
}: MessageStepProps) {
  const reduceMotion = usePrefersReducedMotion();

  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className={
        compact
          ? "mx-auto flex max-w-md flex-col items-center gap-4 text-center"
          : "mx-auto flex max-w-xl flex-col items-center gap-5 px-6 text-center"
      }
      initial={{ opacity: 0, y: reduceMotion ? 0 : 10 }}
      key={message}
      transition={{
        duration: reduceMotion ? 0.15 : 0.55,
        delay: reduceMotion ? 0 : 0.08,
      }}
    >
      <p
        className={
          compact
            ? "font-heading text-2xl leading-tight text-[var(--ink)]"
            : "font-heading text-[clamp(1.75rem,6vw,2.65rem)] leading-[1.05] text-[var(--ink)] lg:text-[clamp(1.75rem,3vw,2.65rem)]"
        }
      >
        {message}
      </p>
      {buttonLabel && onContinue ? (
        <Button
          className="romantic-button"
          disabled={disabled}
          onClick={onContinue}
          size="lg"
        >
          {buttonLabel}
        </Button>
      ) : null}
    </motion.div>
  );
}
