"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Clock3 } from "lucide-react";
import { useTranslations } from "next-intl";
import type { AppLocale } from "@/i18n/routing";

export function ExpiredCard({ language }: { language: AppLocale }) {
  const t = useTranslations("Expired");

  useEffect(() => {
    const previousLanguage = document.documentElement.lang;
    document.documentElement.lang = language;
    return () => {
      document.documentElement.lang = previousLanguage;
    };
  }, [language]);

  return (
    <main
      className="paper-surface flex min-h-svh items-center justify-center px-6 text-center"
      lang={language}
    >
      <div className="max-w-md">
        <Clock3
          aria-hidden="true"
          className="mx-auto mb-6 size-10 text-[var(--gold)]"
          strokeWidth={1.4}
        />
        <h1 className="font-heading text-4xl text-[var(--ink)]">
          {t("title")}
        </h1>
        <p className="mt-4 leading-7 text-[var(--ink-soft)]">
          {t("description")}
        </p>
        <Link
          className="romantic-link mt-8 inline-flex"
          href={`/${language}/create`}
        >
          {t("create")}
        </Link>
      </div>
    </main>
  );
}
