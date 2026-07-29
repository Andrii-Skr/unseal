"use client";

import { useEffect, useRef, useState } from "react";
import { Download, MessageCircle, RotateCcw } from "lucide-react";
import { motion } from "motion/react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import type { CardInput } from "@/lib/card-schema";
import {
  messageRevealDelay,
  signatureRevealDelay,
} from "@/lib/final-message-timing";
import { cn } from "@/lib/utils";

type FinalMessageProps = {
  card: CardInput;
  onReplay?: () => void;
  compact?: boolean;
  preview?: boolean;
};

const LEGACY_DEFAULT_HEADING =
  "Теперь между тобой и моими чувствами не осталось ни одного замка.";
const LEGACY_GIFTS_PARAGRAPH = "Здесь нет подарков и драгоценностей.";
const KEEPSAKE_BACKGROUND_URL = "/art/inside-heart-portrait.png";

function safeFilename(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[^\p{L}\p{N}-]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

function isPoemBlock(block: string) {
  return block.includes("\n");
}

async function loadImageDataUrl(url: string) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Unable to load ${url}`);
  }

  const blob = await response.blob();
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener(
      "load",
      () => {
        if (typeof reader.result === "string") {
          resolve(reader.result);
          return;
        }

        reject(new Error(`Unable to read ${url}`));
      },
      { once: true },
    );
    reader.addEventListener(
      "error",
      () => reject(reader.error ?? new Error(`Unable to read ${url}`)),
      { once: true },
    );
    reader.readAsDataURL(blob);
  });
}

async function loadCanvasImage(src: string) {
  return await new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new window.Image();
    image.addEventListener("load", () => resolve(image), { once: true });
    image.addEventListener(
      "error",
      () => reject(new Error("Unable to decode keepsake background")),
      { once: true },
    );
    image.src = src;
  });
}

function drawCoverImage(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  width: number,
  height: number,
) {
  const scale = Math.max(
    width / image.naturalWidth,
    height / image.naturalHeight,
  );
  const sourceWidth = width / scale;
  const sourceHeight = height / scale;
  const sourceX = (image.naturalWidth - sourceWidth) / 2;
  const sourceY = (image.naturalHeight - sourceHeight) / 2;

  context.drawImage(
    image,
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight,
    0,
    0,
    width,
    height,
  );
}

async function canvasToBlob(canvas: HTMLCanvasElement) {
  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
        return;
      }

      reject(new Error("Unable to encode keepsake"));
    }, "image/png");
  });
}

type KeepsakeContentProps = {
  blocks: string[];
  signature: string;
};

export function KeepsakeContent({
  blocks,
  signature,
}: KeepsakeContentProps) {
  return (
    <div
      className="relative z-10 w-full rounded-[40px] bg-[#5b3548]/62 px-[50px] py-[44px] text-center shadow-[0_28px_90px_rgba(62,30,45,.3)] backdrop-blur-sm"
      data-testid="keepsake-content"
    >
      {blocks.map((block, index) => (
        <p
          className={cn(
            "whitespace-pre-line",
            index === 0
              ? "font-heading text-[52px] leading-[1.08]"
              : isPoemBlock(block)
                ? "mt-[24px] font-heading text-[29px] leading-[1.38]"
                : "mt-[28px] font-sans text-[28px] font-medium leading-[1.38]",
          )}
          data-keepsake-block={index}
          key={`${index}-${block.slice(0, 18)}`}
        >
          {block}
        </p>
      ))}

      {signature ? (
        <p className="mt-[30px] whitespace-pre-line font-heading text-[30px] leading-[1.2] text-[#ffe7bf]">
          {signature}
        </p>
      ) : null}
    </div>
  );
}

export function FinalMessage({
  card,
  onReplay,
  compact = false,
  preview = false,
}: FinalMessageProps) {
  const t = useTranslations("Final");
  const reduceMotion = usePrefersReducedMotion();
  const [controlsRevealed, setControlsRevealed] = useState(
    preview || reduceMotion,
  );
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<
    "idle" | "success" | "error"
  >("idle");
  const [keepsakeMounted, setKeepsakeMounted] = useState(false);
  const keepsakeRef = useRef<HTMLDivElement>(null);
  const rawBlocks = card.finalMessage
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean);
  const blocks = rawBlocks.filter(
    (block) =>
      block !== LEGACY_GIFTS_PARAGRAPH ||
      rawBlocks[0] !== LEGACY_DEFAULT_HEADING,
  );
  const controlsVisible = preview || reduceMotion || controlsRevealed;

  useEffect(() => {
    if (preview || reduceMotion) {
      const frame = window.requestAnimationFrame(() =>
        setControlsRevealed(true),
      );
      return () => window.cancelAnimationFrame(frame);
    }
    if (controlsRevealed) return;

    const timer = window.setTimeout(() => setControlsRevealed(true), 8000);
    return () => window.clearTimeout(timer);
  }, [controlsRevealed, preview, reduceMotion]);

  async function saveKeepsake() {
    if (saving) return;
    setSaving(true);
    setSaveStatus("idle");
    setKeepsakeMounted(true);

    try {
      const backgroundDataUrl = await loadImageDataUrl(
        KEEPSAKE_BACKGROUND_URL,
      );
      const backgroundImage = await loadCanvasImage(backgroundDataUrl);
      await new Promise<void>((resolve) => {
        window.requestAnimationFrame(() => resolve());
      });
      await document.fonts.ready;
      if (!keepsakeRef.current) {
        throw new Error(t("prepareError"));
      }

      const exportHeight = Math.max(
        1350,
        Math.ceil(keepsakeRef.current.scrollHeight),
      );
      const { toCanvas } = await import("html-to-image");
      const contentCanvas = await toCanvas(keepsakeRef.current, {
        width: 1080,
        height: exportHeight,
        pixelRatio: 1,
        cacheBust: true,
        style: {
          height: `${exportHeight}px`,
          left: "0",
          position: "static",
          top: "0",
          transform: "none",
        },
      });

      const keepsakeCanvas = document.createElement("canvas");
      keepsakeCanvas.width = 1080;
      keepsakeCanvas.height = exportHeight;
      const context = keepsakeCanvas.getContext("2d");
      if (!context) {
        throw new Error(t("createError"));
      }

      context.fillStyle = "#b66f86";
      context.fillRect(0, 0, keepsakeCanvas.width, keepsakeCanvas.height);
      drawCoverImage(
        context,
        backgroundImage,
        keepsakeCanvas.width,
        keepsakeCanvas.height,
      );

      const vignette = context.createLinearGradient(
        0,
        keepsakeCanvas.height,
        0,
        0,
      );
      vignette.addColorStop(0, "rgba(74, 38, 55, .62)");
      vignette.addColorStop(0.58, "rgba(74, 38, 55, .06)");
      vignette.addColorStop(1, "rgba(74, 38, 55, .06)");
      context.fillStyle = vignette;
      context.fillRect(0, 0, keepsakeCanvas.width, keepsakeCanvas.height);

      const glow = context.createRadialGradient(
        keepsakeCanvas.width * 0.68,
        keepsakeCanvas.height * 0.23,
        0,
        keepsakeCanvas.width * 0.68,
        keepsakeCanvas.height * 0.23,
        keepsakeCanvas.width * 0.34,
      );
      glow.addColorStop(0, "rgba(255, 235, 184, .27)");
      glow.addColorStop(1, "rgba(255, 235, 184, 0)");
      context.fillStyle = glow;
      context.fillRect(0, 0, keepsakeCanvas.width, keepsakeCanvas.height);
      context.drawImage(contentCanvas, 0, 0);

      const imageBlob = await canvasToBlob(keepsakeCanvas);
      const objectUrl = URL.createObjectURL(imageBlob);
      const link = document.createElement("a");
      link.download = `unseal-${safeFilename(card.recipientName) || "memory"}.png`;
      link.href = objectUrl;
      link.hidden = true;
      document.body.append(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
      setSaveStatus("success");
    } catch (error) {
      console.error(t("logError"), error);
      setSaveStatus("error");
    } finally {
      setKeepsakeMounted(false);
      setSaving(false);
    }
  }

  return (
    <>
      <div
        className={cn(
          "relative z-10 mx-auto flex min-h-dvh w-full max-w-3xl flex-col px-3 text-center text-[#fff8ee] sm:px-10",
          compact
            ? "h-full min-h-0 justify-start overflow-y-auto py-6"
            : "justify-start pb-[calc(5rem+env(safe-area-inset-bottom))] pt-[clamp(2.75rem,7dvh,4rem)]",
        )}
      >
        <div
          className="rounded-[2rem] bg-[#6c4055]/38 px-3 py-7 font-heading shadow-[0_24px_80px_rgba(73,37,52,.28)] backdrop-blur-[6px] sm:px-10 sm:py-8"
          data-testid="final-message-panel"
        >
          {blocks.map((block, index) => (
            <motion.p
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "whitespace-pre-line",
                index === 0
                  ? "font-heading text-[clamp(1.7rem,7vw,3.6rem)] leading-[1.08]"
                  : !isPoemBlock(block)
                    ? "mt-6 text-[clamp(1.18rem,4.9vw,1.35rem)] font-medium leading-[1.45] sm:text-2xl"
                    : "mt-7 font-heading text-[clamp(1rem,4.35vw,1.2rem)] leading-[1.5] sm:text-[clamp(1.15rem,2.6vw,2rem)] sm:leading-[1.45]",
              )}
              data-message-block={index}
              data-poem-block={isPoemBlock(block) ? "true" : undefined}
              initial={
                preview || reduceMotion
                  ? { opacity: 1, y: 0 }
                  : { opacity: 0, y: 18 }
              }
              key={`${index}-${block.slice(0, 18)}`}
              transition={{
                duration: reduceMotion ? 0.15 : 0.8,
                delay:
                  preview || reduceMotion ? 0 : messageRevealDelay(index),
              }}
            >
              {isPoemBlock(block)
                ? block.split("\n").map((line, lineIndex) => (
                    <span
                      className="block"
                      data-poem-line
                      key={`${lineIndex}-${line.slice(0, 12)}`}
                    >
                      {line}
                    </span>
                  ))
                : block}
            </motion.p>
          ))}

          {card.signature ? (
            <motion.p
              animate={{ opacity: 1 }}
              className="mt-10 whitespace-pre-line font-heading text-xl leading-snug text-[#ffe9c6] sm:text-3xl"
              initial={preview || reduceMotion ? { opacity: 1 } : { opacity: 0 }}
              transition={{
                duration: reduceMotion ? 0.15 : 0.8,
                delay:
                  preview || reduceMotion
                    ? 0
                    : signatureRevealDelay(blocks.length),
              }}
            >
              {card.signature}
            </motion.p>
          ) : null}
        </div>

        {!compact ? (
          <motion.div
            animate={{
              opacity: controlsVisible ? 1 : 0,
              y: controlsVisible ? 0 : 10,
            }}
            aria-hidden={!controlsVisible}
            className="mt-8 flex flex-col justify-center gap-3 sm:flex-row sm:flex-wrap"
            initial={false}
          >
            <Button
              className="romantic-button"
              disabled={!controlsVisible || saving}
              onClick={onReplay}
              size="lg"
            >
              <RotateCcw aria-hidden="true" />
              {t("replay")}
            </Button>
            <Button
              className="romantic-button-outline border-white/40 bg-white/15 text-white hover:bg-white/25 hover:text-white"
              disabled={!controlsVisible || saving}
              onClick={saveKeepsake}
              size="lg"
              variant="outline"
            >
              <Download aria-hidden="true" />
              {saving
                ? t("creatingPng")
                : saveStatus === "success"
                  ? t("saved")
                  : t("save")}
            </Button>
            {card.replyUrl ? (
              <a
                aria-disabled={!controlsVisible}
                className={cn(
                  "romantic-button-outline inline-flex items-center justify-center gap-2 border-white/40 bg-white/15 text-sm font-medium text-white",
                  !controlsVisible && "pointer-events-none opacity-50",
                )}
                href={controlsVisible ? card.replyUrl : undefined}
                rel="noopener noreferrer"
                tabIndex={controlsVisible ? undefined : -1}
                target="_blank"
              >
                <MessageCircle aria-hidden="true" className="size-4" />
                {t("reply")}
              </a>
            ) : null}
            <p
              aria-live="polite"
              className={cn(
                "text-sm sm:basis-full",
                saveStatus === "error"
                  ? "text-[#ffe1e1]"
                  : "text-[#fff3dc]",
              )}
              role="status"
            >
              {saveStatus === "success"
                ? t("saveSuccess")
                : saveStatus === "error"
                  ? t("saveError")
                  : ""}
            </p>
          </motion.div>
        ) : null}
      </div>

      {keepsakeMounted ? (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed left-[-10000px] top-0 flex min-h-[1350px] w-[1080px] items-end overflow-hidden p-[60px] text-white"
          data-testid="keepsake-export"
          ref={keepsakeRef}
        >
          <KeepsakeContent blocks={blocks} signature={card.signature} />
        </div>
      ) : null}
    </>
  );
}
