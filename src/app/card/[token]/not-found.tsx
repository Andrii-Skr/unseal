import Link from "next/link";
import { HeartCrack } from "lucide-react";

export default function CardNotFound() {
  return (
    <main className="paper-surface flex min-h-svh items-center justify-center px-6 text-center">
      <div className="max-w-md">
        <HeartCrack
          aria-hidden="true"
          className="mx-auto mb-6 size-10 text-[var(--rose-deep)]"
          strokeWidth={1.4}
        />
        <h1 className="font-heading text-4xl text-[var(--ink)]">
          Эта история не нашлась
        </h1>
        <p className="mt-4 leading-7 text-[var(--ink-soft)]">
          Возможно, в ссылке потерялся один символ.
        </p>
        <Link className="romantic-link mt-8 inline-flex" href="/create">
          Создать новую открытку
        </Link>
      </div>
    </main>
  );
}
