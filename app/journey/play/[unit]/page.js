import { notFound } from "next/navigation";
import { UNITS, getUnit } from "@/data/journey/units";
import JourneyPlayScreen from "@/components/journey/journey-play-screen";

export function generateStaticParams() {
  return UNITS.map((unit) => ({ unit: unit.slug }));
}

export default async function JourneyPlayPage({ params }) {
  const { unit: slug } = await params;
  const unit = getUnit(slug);
  if (!unit) notFound();
  return <JourneyPlayScreen unit={unit} />;
}
