import Link from "next/link";
import { HeartCrack } from "lucide-react";
import { useTranslations } from "next-intl";

export default function CardNotFound() {
  const t = useTranslations("NotFound");
  const commonT = useTranslations("Common");

  return (
    <main className="paper-surface flex min-h-svh items-center justify-center px-6 text-center">
      <div className="max-w-md">
        <HeartCrack
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
        <Link className="romantic-link mt-8 inline-flex" href="/en/create">
          {commonT("createNew")}
        </Link>
      </div>
    </main>
  );
}
