"use client";

import { useRouter } from "next/navigation";
import JourneyPlayer from "./journey-player";
import { completeUnit } from "@/lib/journey-progress";

// Wires JourneyPlayer to progress + navigation: marks the unit complete in
// lunadeck.journey.v1 and returns to the unit-select screen once the last
// beat resolves.
export default function JourneyPlayScreen({ unit }) {
  const router = useRouter();

  function handleComplete() {
    completeUnit(unit.slug);
    router.push("/journey");
  }

  return <JourneyPlayer unit={unit} onComplete={handleComplete} />;
}
