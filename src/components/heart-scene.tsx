"use client";

import type { Ref } from "react";
import { HeartBackground } from "@/components/heart-background";
import { LockLayer } from "@/components/lock-layer";

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
  return (
    <div
      className={
        compact
          ? "relative mx-auto aspect-square w-[min(88%,29rem)] shrink-0"
          : "relative mx-auto aspect-square w-[92vw] max-w-[39rem] shrink-0 sm:w-[88vw] lg:w-full"
      }
      ref={sceneRef}
    >
      <HeartBackground loosened={loosened} />
      <LockLayer
        openedCount={openedCount}
        openingLockIndex={openingLockIndex}
      />
    </div>
  );
}
