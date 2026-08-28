import { notFound } from "next/navigation";
import { getUnit, getUnits, getSession } from "@/lib/data";
import Session from "./session";

export async function generateStaticParams() {
  const units = await getUnits();
  return units.map((u) => ({ unit: String(u.number) }));
}

export default async function PlayPage({ params }) {
  const { unit: unitParam } = await params;
  const unit = await getUnit(unitParam);
  if (!unit) notFound();

  const nodes = await getSession(unit.number);

  return <Session unitNumber={unit.number} unitName={unit.name} nodes={nodes} />;
}
