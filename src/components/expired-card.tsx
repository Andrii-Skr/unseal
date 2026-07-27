import Link from "next/link";
import { Clock3 } from "lucide-react";

export function ExpiredCard() {
  return (
    <main className="paper-surface flex min-h-svh items-center justify-center px-6 text-center">
      <div className="max-w-md">
        <Clock3
          aria-hidden="true"
          className="mx-auto mb-6 size-10 text-[var(--gold)]"
          strokeWidth={1.4}
        />
        <h1 className="font-heading text-4xl text-[var(--ink)]">
          Эта открытка уже закрылась
        </h1>
        <p className="mt-4 leading-7 text-[var(--ink-soft)]">
          Её слова хранились семь дней, а затем были бережно удалены.
        </p>
        <Link className="romantic-link mt-8 inline-flex" href="/create">
          Создать новую историю
        </Link>
      </div>
    </main>
  );
}
