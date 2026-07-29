import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import type { Metadata } from "next";
import { CardExperience } from "@/components/card-experience";
import { ExpiredCard } from "@/components/expired-card";
import { getMessagesForLocale } from "@/i18n/messages";
import { getPublicCard } from "@/lib/cards";

type CardPageProps = {
  params: Promise<{ token: string }>;
};

export async function generateMetadata({
  params,
}: CardPageProps): Promise<Metadata> {
  const { token } = await params;
  const result = await getPublicCard(token);
  const language =
    result.status === "active"
      ? result.card.language
      : result.status === "expired"
        ? result.language
        : "en";
  return {
    title: getMessagesForLocale(language).Card.metadataTitle,
  };
}

export default async function CardPage({ params }: CardPageProps) {
  const { token } = await params;
  const result = await getPublicCard(token);

  if (result.status === "missing") {
    notFound();
  }

  if (result.status === "expired") {
    return (
      <NextIntlClientProvider
        locale={result.language}
        messages={getMessagesForLocale(result.language)}
      >
        <ExpiredCard language={result.language} />
      </NextIntlClientProvider>
    );
  }

  return (
    <NextIntlClientProvider
      locale={result.card.language}
      messages={getMessagesForLocale(result.card.language)}
    >
      <CardExperience card={result.card} />
    </NextIntlClientProvider>
  );
}
