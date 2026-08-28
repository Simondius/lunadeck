import { notFound } from "next/navigation";
import { getUnit, getUnits, getSections, getSession } from "@/lib/data";
import Session from "@/components/lesson/session";

// A lesson is one section — seven or eight nodes — not a whole unit. That is
// what the segmented progress bar counts and what Spec_MainPath describes.
export async function generateStaticParams() {
  const units = await getUnits();
  const params = [];
  for (const unit of units) {
    for (const section of await getSections(unit.number)) {
      params.push({ unit: String(unit.number), section: section.section });
    }
  }
  return params;
}

export default async function PlayPage({ params }) {
  const { unit: unitParam, section: sectionParam } = await params;
  const unit = await getUnit(unitParam);
  if (!unit) notFound();

  const sections = await getSections(unit.number);
  const wanted = decodeURIComponent(sectionParam);
  const section = sections.find((s) => s.section === wanted);
  if (!section) notFound();

  const nodes = await getSession(unit.number, section.section);

  return (
    <Session
      unitNumber={unit.number}
      unitName={unit.name}
      section={section}
      nodes={nodes}
    />
  );
}
