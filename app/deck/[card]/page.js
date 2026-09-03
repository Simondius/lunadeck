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

  // Which section teaches this card. The client needs it twice over: to know
  // whether the entry has been earned, and to say where the card lives — the
  // job the unit guidebook used to do, done per card, on the card you asked
  // about. section.href already points at v4's own real lesson route
  // (getAllSections(), 0082) - no minor arcana card has one yet.
  const section = sections.find((s) => s.cardKey === cardKey) ?? null;

  return (
    <CardPage
      card={card}
      nodeIds={section?.nodeIds ?? []}
      lesson={section?.href ? { unitName: section.unitName, href: section.href } : null}
    />
  );
}
