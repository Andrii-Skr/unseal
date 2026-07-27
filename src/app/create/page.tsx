import type { Metadata } from "next";
import { CardCreatorForm } from "@/components/card-creator-form";

export const metadata: Metadata = {
  title: "Создать открытку",
};

export default function CreateCardPage() {
  return <CardCreatorForm />;
}
