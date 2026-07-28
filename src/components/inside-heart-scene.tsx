"use client";

import { useEffect } from "react";
import { getImageProps } from "next/image";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

type InsideHeartSceneProps = {
  children?: React.ReactNode;
  compact?: boolean;
};

function ResponsiveSceneImage({ compact }: { compact: boolean }) {
  const common = {
    alt: "Силуэт человека в худи смотрит на тёплый свет вдали",
    fetchPriority: compact ? ("auto" as const) : ("high" as const),
    loading: compact ? ("lazy" as const) : ("eager" as const),
    sizes: compact ? "(min-width: 1024px) 45vw, 100vw" : "100vw",
    quality: 88,
  };
  const {
    props: { srcSet: desktop },
  } = getImageProps({
    ...common,
    src: "/art/inside-heart-landscape.png",
    width: 1672,
    height: 941,
  });
  const {
    props: { srcSet: mobile, ...rest },
  } = getImageProps({
    ...common,
    src: "/art/inside-heart-portrait.png",
    width: 1024,
    height: 1536,
  });

  return (
    <picture>
      <source media="(min-width: 768px)" srcSet={desktop} />
      <source media="(max-width: 767px)" srcSet={mobile} />
      <img
        {...rest}
        alt={common.alt}
        className="size-full object-cover"
        draggable={false}
      />
    </picture>
  );
}

export function InsideHeartScene({
  children,
  compact = false,
}: InsideHeartSceneProps) {
  useEffect(() => {
    if (compact) return;

    const root = document.documentElement;
    const body = document.body;
    root.classList.add("inside-heart-active");
    body.classList.add("inside-heart-active");

    return () => {
      root.classList.remove("inside-heart-active");
      body.classList.remove("inside-heart-active");
    };
  }, [compact]);

  return (
    <>
      {!compact ? (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-[#9a536d]"
          data-testid="inside-heart-backdrop"
        >
          <ResponsiveSceneImage compact={false} />
          <div
            className="inside-vignette absolute inset-0"
            data-testid="inside-heart-vignette"
          />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_68%_23%,rgba(255,235,184,.27),transparent_22%)]" />
        </div>
      ) : null}

      <motion.section
        animate={{ opacity: 1 }}
        className={cn(
          "relative isolate overflow-hidden",
          compact
            ? "h-full min-h-[32rem] rounded-[1.5rem] bg-[#9a536d]"
            : "z-10 min-h-dvh bg-transparent",
        )}
        initial={{ opacity: compact ? 0 : 1 }}
        transition={{ duration: compact ? 0.5 : 0 }}
      >
        {compact ? (
          <>
            <div
              className="absolute inset-0 -z-20"
              data-testid="inside-heart-backdrop"
            >
              <ResponsiveSceneImage compact />
            </div>
            <div
              aria-hidden="true"
              className="inside-vignette absolute inset-0 -z-10"
              data-testid="inside-heart-vignette"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_68%_23%,rgba(255,235,184,.27),transparent_22%)]"
            />
          </>
        ) : null}
        {children}
      </motion.section>
    </>
  );
}
