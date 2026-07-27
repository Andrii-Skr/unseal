"use client";

import type { Ref } from "react";
import { motion } from "motion/react";
import { HeartBackground } from "@/components/heart-background";
import { LockLayer } from "@/components/lock-layer";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";

type HeartSceneProps = {
  openedCount: number;
  openingLockIndex?: number | null;
  loosened?: boolean;
  compact?: boolean;
  sceneRef?: Ref<HTMLDivElement>;
};

export function HeartScene({
  openedCount,
  openingLockIndex = null,
  loosened = false,
  compact = false,
  sceneRef,
}: HeartSceneProps) {
  const reduceMotion = usePrefersReducedMotion();

  return (
    <motion.div
      animate={{
        opacity: 1,
        scale:
          reduceMotion || openingLockIndex === null
            ? 1
            : 1.006,
      }}
      className={
        compact
          ? "relative mx-auto aspect-square w-[min(88%,29rem)]"
          : "relative mx-auto aspect-square w-[92vw] max-w-[39rem] sm:w-[88vw] lg:w-full"
      }
      initial={{ opacity: 0, scale: reduceMotion ? 1 : 0.96 }}
      ref={sceneRef}
      transition={{
        duration: reduceMotion ? 0.15 : 0.75,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      <HeartBackground loosened={loosened} />
      <LockLayer
        openedCount={openedCount}
        openingLockIndex={openingLockIndex}
      />
    </motion.div>
  );
}
