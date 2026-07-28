"use client";

import { Button } from "@/components/ui/button";

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
  return (
    <div
      className={
        compact
          ? "mx-auto flex w-full max-w-md shrink-0 flex-col items-center gap-4 text-center"
          : "mx-auto flex w-full max-w-xl shrink-0 flex-col items-center gap-5 px-6 text-center"
      }
      data-testid="message-step"
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
    </div>
  );
}
