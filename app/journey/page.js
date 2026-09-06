"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { UNITS } from "@/data/journey/units";
import { isUnitComplete } from "@/lib/journey-progress";

// Unit-select screen. Minimal by design ("we will build out one unit at a
// time") - this grows into a real path view once more than one unit
// exists; for now it is just a list.
export default function JourneyHome() {
  const [completed, setCompleted] = useState({});

  useEffect(() => {
    setCompleted(
      Object.fromEntries(UNITS.map((unit) => [unit.slug, isUnitComplete(unit.slug)]))
    );
  }, []);

  return (
    <div className="journey-stage">
      <div className="journey-bg is-nightwall" aria-hidden="true" />
      <div className="journey-content">
        <p className="journey-text is-narrative" style={{ fontStyle: "normal" }}>
          Journey
        </p>
        <div className="journey-choices">
          {UNITS.map((unit) => (
            <Link key={unit.slug} href={`/journey/play/${unit.slug}`} className="journey-choice">
              {unit.cardName}
              {completed[unit.slug] ? " ✓" : ""}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
