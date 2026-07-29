"use client";

import { useEffect } from "react";
import Link from "next/link";
import { RefreshCw, TriangleAlert } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

type CardErrorProps = {
  error: Error & { digest?: string };
  unstable_retry: () => void;
};

export default function CardError({
  error,
  unstable_retry,
}: CardErrorProps) {
  const t = useTranslations("CardError");
  const commonT = useTranslations("Common");

  useEffect(() => {
    console.error("Card page failed", error);
  }, [error]);

  return (
    <main className="paper-surface flex min-h-svh items-center justify-center px-6 text-center">
      <div className="max-w-md">
        <TriangleAlert
          aria-hidden="true"
          className="mx-auto mb-6 size-10 text-[var(--rose-deep)]"
          strokeWidth={1.4}
        />
        <h1 className="font-heading text-4xl text-[var(--ink)]">
          {t("title")}
        </h1>
        <p className="mt-4 leading-7 text-[var(--ink-soft)]">
          {t("description")}
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button
            className="romantic-button"
            onClick={unstable_retry}
            size="lg"
          >
            <RefreshCw aria-hidden="true" />
            {t("retry")}
          </Button>
          <Link className="romantic-link inline-flex" href="/en/create">
            {commonT("createNew")}
          </Link>
        </div>
      </div>
    </main>
  );
}
