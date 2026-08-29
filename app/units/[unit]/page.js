import { notFound } from "next/navigation";
import Link from "next/link";
import { getUnit, getUnits, getSections, getCardNames, circleForKey } from "@/lib/data";
import Guidebook from "@/components/guidebook";

export async function generateStaticParams() {
  const units = await getUnits();
  return units.map((u) => ({ unit: String(u.number) }));
}

// Reached from a unit's inline banner on the path. Read-only reference, not a
// navigation step — Spec_MainPath Section 2 lists the Guidebook as a modal
// showing the unit's intro copy, and the path itself now carries the sections.
export default async function UnitPage({ params }) {
  const { unit: unitParam } = await params;
  const unit = await getUnit(unitParam);
  if (!unit) notFound();

  const [sections, names] = await Promise.all([getSections(unit.number), getCardNames()]);

  const cards = unit.cardKeys.map((key) => ({
    key,
    name: names.get(key) ?? key,
    image: circleForKey(key),
  }));

  return (
    <Guidebook
      unit={{
        number: unit.number,
        name: unit.name,
        tagline: unit.tagline,
        intro: unit.intro,
        cardCount: unit.cardCount,
        minutesTypical: unit.minutesTypical,
      }}
      sections={sections.map((s) => ({
        section: s.section,
        kind: s.kind,
        cardKey: s.cardKey,
        cardName: s.cardName,
        nodeIds: s.nodeIds,
      }))}
      cards={cards}
    />
  );
}
