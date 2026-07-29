"use client";

import {
  type ReactNode,
  useEffect,
  useRef,
} from "react";
import { HEART_ENTRY_DURATION_MS } from "@/lib/motion-timings";

type HeartZoomTransitionProps = {
  active: boolean;
  children: ReactNode;
  onComplete: () => void;
};

export function HeartZoomTransition({
  active,
  children,
  onComplete,
}: HeartZoomTransitionProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!active || !container) return;

    let cancelled = false;

    if (!container.animate) {
      container.classList.add("heart-entry-zoom-fallback");
      const fallbackTimer = window.setTimeout(() => {
        if (!cancelled) onComplete();
      }, HEART_ENTRY_DURATION_MS);

      return () => {
        cancelled = true;
        window.clearTimeout(fallbackTimer);
        container.classList.remove("heart-entry-zoom-fallback");
      };
    }

    const animation = container.animate(
      [
        { transform: "translate3d(0, 0, 0) scale(1)" },
        { transform: "translate3d(0, 0, 0) scale(5.2)" },
      ],
      {
        duration: HEART_ENTRY_DURATION_MS,
        easing: "cubic-bezier(0.55, 0.02, 0.2, 1)",
        fill: "forwards",
      },
    );

    void animation.finished.then(
      () => {
        if (!cancelled) onComplete();
      },
      () => undefined,
    );

    return () => {
      cancelled = true;
      animation.cancel();
    };
  }, [active, onComplete]);

  return (
    <div
      className="heart-entry-zoom relative z-30 w-full"
      data-active={active}
      data-testid="heart-zoom-transition"
      ref={containerRef}
    >
      {children}
    </div>
  );
}
