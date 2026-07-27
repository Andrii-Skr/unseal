"use client";

import Image from "next/image";
import { motion } from "motion/react";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";

export type HeartZoomOrigin = {
  height: number;
  left: number;
  top: number;
  width: number;
};

type HeartZoomTransitionProps = {
  origin?: HeartZoomOrigin | null;
};

export function HeartZoomTransition({
  origin,
}: HeartZoomTransitionProps) {
  const reduceMotion = usePrefersReducedMotion();

  return (
    <motion.div
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-40 overflow-hidden"
      data-testid="heart-zoom-transition"
      exit={{ opacity: 0 }}
      initial={{ opacity: 1 }}
      transition={{ duration: reduceMotion ? 0.15 : 0.3 }}
    >
      <motion.div
        animate={{ opacity: reduceMotion ? 0 : [1, 0.96, 0] }}
        aria-hidden="true"
        className="heart-zoom-paper absolute inset-0"
        data-testid="heart-zoom-paper"
        initial={{ opacity: 1 }}
        transition={
          reduceMotion
            ? { duration: 0.18, ease: "easeOut" }
            : {
                duration: 1.75,
                ease: "easeInOut",
                times: [0, 0.3, 1],
              }
        }
      />

      <motion.div
        animate={{ opacity: reduceMotion ? 0 : [0, 0.3, 0] }}
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,235,192,.7),transparent_42%)] lg:bg-[radial-gradient(circle_at_25%_50%,rgba(255,235,192,.7),transparent_38%)]"
        initial={{ opacity: 0 }}
        transition={
          reduceMotion
            ? { duration: 0.15 }
            : { duration: 2.2, ease: "easeInOut", times: [0, 0.48, 1] }
        }
      />

      <div
        className={
          origin
            ? "absolute"
            : "absolute left-1/2 top-1/2 aspect-square w-[92vmin] -translate-x-1/2 -translate-y-1/2 lg:left-1/4 lg:w-[min(44vw,69dvh,39rem)]"
        }
        style={
          origin
            ? {
                height: origin.height,
                left: origin.left,
                top: origin.top,
                width: origin.width,
              }
            : undefined
        }
        data-testid="heart-zoom-art"
      >
        <motion.div
          animate={
            reduceMotion
              ? { opacity: 0 }
              : { scale: 5.2, opacity: [1, 1, 0.96, 0] }
          }
          className="absolute inset-0"
          initial={{ scale: 1, opacity: 1 }}
          transition={
            reduceMotion
              ? { duration: 0.2, ease: "easeOut" }
              : {
                  opacity: {
                    duration: 2.2,
                    ease: "easeInOut",
                    times: [0, 0.6, 0.82, 1],
                  },
                  scale: {
                    duration: 2.2,
                    ease: [0.55, 0.02, 0.2, 1],
                  },
                }
          }
        >
          <Image
            alt=""
            aria-hidden="true"
            className="object-contain"
            fill
            loading="eager"
            sizes="(min-width: 1024px) min(44vw, 39rem), 92vmin"
            src="/art/heart-ribbon-loose.png"
          />
        </motion.div>
      </div>
    </motion.div>
  );
}
