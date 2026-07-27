import { notFound } from "next/navigation";
import { CardExperience } from "@/components/card-experience";
import { ExpiredCard } from "@/components/expired-card";
import { readPublicCard } from "@/lib/cards";

type CardPageProps = {
  params: Promise<{ token: string }>;
};

export default async function CardPage({ params }: CardPageProps) {
  const { token } = await params;
  const result = await readPublicCard(token);

  if (result.status === "missing") {
    notFound();
  }

  if (result.status === "expired") {
    return <ExpiredCard />;
  }

  return <CardExperience card={result.card} />;
}
