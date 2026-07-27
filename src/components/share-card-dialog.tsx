"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { Check, Copy, ExternalLink, Share2 } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { copyText } from "@/lib/clipboard";

type ShareCardDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  url: string;
};

const subscribeToShareCapability = () => () => undefined;
const getShareCapability = () =>
  typeof navigator !== "undefined" && typeof navigator.share === "function";
const getServerShareCapability = () => false;
const qrHeartSettings = {
  excavate: true,
  height: 32,
  src: "/art/qr-heart.svg",
  width: 32,
} as const;

export function ShareCardDialog({
  open,
  onOpenChange,
  url,
}: ShareCardDialogProps) {
  const [copied, setCopied] = useState(false);
  const canShare = useSyncExternalStore(
    subscribeToShareCapability,
    getShareCapability,
    getServerShareCapability,
  );
  const urlFieldRef = useRef<HTMLInputElement>(null);
  const resetTimerRef = useRef<number | null>(null);
  const copyOperationRef = useRef(0);
  const openRef = useRef(open);

  useEffect(() => {
    openRef.current = open;
    if (!open) copyOperationRef.current += 1;
  }, [open]);

  useEffect(() => {
    return () => {
      copyOperationRef.current += 1;
      if (resetTimerRef.current !== null) {
        window.clearTimeout(resetTimerRef.current);
      }
    };
  }, []);

  function clearCopiedState() {
    if (resetTimerRef.current !== null) {
      window.clearTimeout(resetTimerRef.current);
      resetTimerRef.current = null;
    }
    setCopied(false);
  }

  function handleOpenChange(nextOpen: boolean) {
    openRef.current = nextOpen;
    if (!nextOpen) {
      copyOperationRef.current += 1;
      clearCopiedState();
    }
    onOpenChange(nextOpen);
  }

  async function copyUrl() {
    if (!openRef.current) return;
    const operation = copyOperationRef.current + 1;
    copyOperationRef.current = operation;
    const copiedSuccessfully = await copyText(url);
    if (!openRef.current || copyOperationRef.current !== operation) return;

    if (!copiedSuccessfully) {
      urlFieldRef.current?.focus();
      urlFieldRef.current?.select();
      return;
    }

    if (resetTimerRef.current !== null) {
      window.clearTimeout(resetTimerRef.current);
    }
    setCopied(true);
    resetTimerRef.current = window.setTimeout(() => {
      resetTimerRef.current = null;
      setCopied(false);
    }, 1800);
  }

  async function shareUrl() {
    if (!canShare) {
      await copyUrl();
      return;
    }

    try {
      await navigator.share({
        title: "Для тебя — Unseal",
        text: "Я оставил(а) для тебя кое-что важное.",
        url,
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      await copyUrl();
    }
  }

  return (
    <Dialog onOpenChange={handleOpenChange} open={open}>
      <DialogContent
        className="paper-surface top-[50dvh] max-h-[calc(100dvh-1rem)] max-w-md overflow-hidden border-[var(--rose-deep)]/15 p-0 sm:top-1/2 sm:max-h-[calc(100dvh-2rem)] sm:max-w-md"
        style={{ position: "fixed" }}
      >
        <div className="scrollbar-soft grid min-h-0 gap-4 overflow-y-auto overscroll-contain px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-6 sm:p-6">
          <DialogHeader className="pr-7 text-center">
            <DialogTitle className="font-heading text-3xl text-[var(--ink)]">
              Открытка запечатана
            </DialogTitle>
            <DialogDescription className="leading-6">
              Ссылка будет работать семь дней. Личные слова не содержатся в её
              адресе.
            </DialogDescription>
          </DialogHeader>

          <div
            aria-label="QR-код открытки"
            className="mx-auto rounded-[1.5rem] bg-white p-3 shadow-sm sm:p-4"
            role="img"
          >
            {url ? (
              <QRCodeSVG
                bgColor="#fffaf3"
                className="size-[clamp(9.5rem,24dvh,11.5rem)]"
                fgColor="#7d465b"
                imageSettings={qrHeartSettings}
                level="H"
                marginSize={1}
                size={184}
                value={url}
              />
            ) : null}
          </div>

          <input
            aria-label="Ссылка на открытку"
            className="w-full truncate rounded-xl border border-[var(--rose-deep)]/15 bg-white/55 px-3 py-2 text-center text-xs text-[var(--ink-soft)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--rose-deep)]/40"
            onFocus={(event) => event.currentTarget.select()}
            readOnly
            ref={urlFieldRef}
            suppressHydrationWarning
            value={url}
          />

          <div className="grid grid-cols-2 gap-2">
            <Button
              className="romantic-button px-3"
              onClick={copyUrl}
              size="lg"
            >
              {copied ? <Check /> : <Copy />}
              {copied ? "Готово" : "Копировать"}
            </Button>
            <Button
              className="romantic-button-outline px-3"
              onClick={shareUrl}
              size="lg"
              variant="outline"
            >
              <Share2 />
              {canShare ? "Поделиться" : "Скопировать"}
            </Button>
          </div>

          <Link
            className="romantic-link mx-auto inline-flex gap-2"
            href={url || "/create"}
          >
            Открыть открытку
            <ExternalLink aria-hidden="true" className="size-4" />
          </Link>
        </div>
      </DialogContent>
    </Dialog>
  );
}
