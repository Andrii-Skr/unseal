"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";

export type LockDefinition = {
  id: number;
  xPercent: number;
  yPercent: number;
  widthPercent: number;
  rotation: number;
};

type RomanticLockProps = {
  lock: LockDefinition;
  visible: boolean;
  opening: boolean;
};

export function RomanticLock({
  lock,
  visible,
  opening,
}: RomanticLockProps) {
  const reduceMotion = usePrefersReducedMotion();

  return (
    <div
      className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2"
      style={{
        left: `${lock.xPercent}%`,
        top: `${lock.yPercent}%`,
        width: `${lock.widthPercent}%`,
        aspectRatio: "1 / 1",
      }}
    >
      <AnimatePresence>
        {visible ? (
          <motion.div
            animate={
              opening
                ? reduceMotion
                  ? { opacity: 0 }
                  : {
                      opacity: [1, 1, 0],
                      rotate: [
                        lock.rotation,
                        lock.rotation - 4,
                        lock.rotation + 4,
                        lock.rotation,
                      ],
                      scale: [1, 1.09, 0.96],
                      y: [0, -3, 24],
                      filter: [
                        "drop-shadow(0 4px 7px rgb(117 62 76 / 25%))",
                        "drop-shadow(0 0 22px rgb(220 174 83 / 90%))",
                        "drop-shadow(0 0 8px rgb(220 174 83 / 0%))",
                      ],
                    }
                : {
                    opacity: 1,
                    rotate: lock.rotation,
                    scale: 1,
                    y: 0,
                    filter:
                      "drop-shadow(0 4px 7px rgb(117 62 76 / 25%))",
                  }
            }
            aria-hidden="true"
            className="absolute inset-0"
            exit={{ opacity: 0 }}
            initial={{ opacity: 0, scale: 0.92 }}
            transition={
              opening
                ? { duration: reduceMotion ? 0.15 : 0.9, ease: "easeInOut" }
                : { duration: 0.35 }
            }
          >
            <Image
              alt=""
              className="object-contain"
              fill
              sizes="(max-width: 1024px) 18vw, 110px"
              src={`/art/locks/lock-${lock.id}.png`}
            />
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
