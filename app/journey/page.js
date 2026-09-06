"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { UNITS } from "@/data/journey/units";
import { isUnitComplete } from "@/lib/journey-progress";

// Unit-select screen. Minimal by design ("we will build out one unit at a
// time") - this grows into a real path view once more than one unit
// exists; for now it is just a list.
//
// A plain `.shell` (the app's standard scrollable page wrapper, same as
// /deck and /guide), NOT `.journey-stage`/`.journey-content` - those are
// the full-bleed, bottom-anchored layout the beat *player* uses, built for
// a screen where TabBar hides itself (any /play route). This index page is
// a normal tab (TabBar stays visible, per components/tabbar.jsx), so its
// content has to sit in the page's own scrollable flow above the tab bar,
// not pinned to the literal bottom edge of a 100dvh box underneath it -
// that combination is what made this screen read as blank: the one thing
// on it was rendering behind the tab bar.
export default function JourneyHome() {
  const [completed, setCompleted] = useState({});

  useEffect(() => {
    setCompleted(
      Object.fromEntries(UNITS.map((unit) => [unit.slug, isUnitComplete(unit.slug)]))
    );
  }, []);

  return (
    <main className="shell">
      <h1 className="journey-home-title">Journey</h1>
      <div className="journey-choices">
        {UNITS.map((unit) => (
          <Link key={unit.slug} href={`/journey/play/${unit.slug}`} className="journey-choice">
            {unit.cardName}
            {completed[unit.slug] ? " ✓" : ""}
          </Link>
        ))}
      </div>
    </main>
  );
}
