import { notFound } from "next/navigation";
import { getCardPage, getAllCardKeys, getAllSections } from "@/lib/data";
import CardPage from "@/components/card-page";

export async function generateStaticParams() {
  const keys = await getAllCardKeys();
  return keys.map((card) => ({ card }));
}

export default async function Card({ params }) {
  const { card: cardKey } = await params;
  const [card, sections] = await Promise.all([getCardPage(cardKey), getAllSections()]);
  if (!card) notFound();

  // Which section teaches this card — the client needs it to know whether the
  // learner has earned the entry yet.
  const section = sections.find((s) => s.cardKey === cardKey) ?? null;

  return <CardPage card={card} nodeIds={section?.nodeIds ?? []} />;
}
