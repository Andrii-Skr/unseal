import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { CardCreatorForm } from "@/components/card-creator-form";
import { routing } from "@/i18n/routing";

type CreateCardPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({
  params,
}: CreateCardPageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: "Metadata" });
  return { title: t("createTitle") };
}

export default async function CreateCardPage({
  params,
}: CreateCardPageProps) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  return <CardCreatorForm locale={locale} />;
}
