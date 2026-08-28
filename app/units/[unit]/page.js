import { notFound } from "next/navigation";
import { getUnit, getUnits, getSections, getCardNames, circleForKey } from "@/lib/data";
import UnitScreen from "@/components/unit-screen";

export async function generateStaticParams() {
  const units = await getUnits();
  return units.map((u) => ({ unit: String(u.number) }));
}

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
    <UnitScreen
      unit={{ number: unit.number, name: unit.name, intro: unit.intro }}
      sections={sections}
      cards={cards}
    />
  );
}
