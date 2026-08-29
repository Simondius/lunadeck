"use client";

import Link from "next/link";
import { useProgress } from "@/components/use-progress";
import { countComplete, isSectionComplete } from "@/lib/progress";

// A unit's guidebook: what it teaches and how far through it you are. It is
// reference, not navigation — the path carries every section now, so nothing
// in the forward flow routes through here.
export default function Guidebook({ unit, sections, cards }) {
  const progress = useProgress();

  const done = sections.filter((s) => isSectionComplete(progress, s.nodeIds)).length;
  const known = new Set(
    sections.filter((s) => s.cardKey && isSectionComplete(progress, s.nodeIds)).map((s) => s.cardKey)
  );
  const nodesLeft = sections.reduce(
    (n, s) => n + (s.nodeIds.length - countComplete(progress, s.nodeIds)),
    0
  );

  return (
    <main className="shell">
      <Link className="backlink" href="/">
        ← Path
      </Link>

      <span className="unit-eyebrow">
        Unit {unit.number} · Guidebook
      </span>
      <h1 className="unit-title">{unit.name}</h1>
      <p className="unit-intro">{unit.intro}</p>

      <div className="card-row">
        {cards.map((card) => (
          <img
            key={card.key}
            className={known.has(card.key) ? undefined : "is-unknown"}
            src={card.image}
            alt={card.name}
            title={card.name}
          />
        ))}
      </div>

      <div className="stats">
        <div>
          <span className="stat-value">
            {done}/{sections.length}
          </span>
          <span className="stat-label">Sections</span>
        </div>
        <div>
          <span className="stat-value">
            {known.size}/{unit.cardCount}
          </span>
          <span className="stat-label">Cards known</span>
        </div>
        <div>
          <span className="stat-value">{Math.max(0, Math.round((nodesLeft * 90) / 60))}</span>
          <span className="stat-label">Minutes left</span>
        </div>
      </div>

      <p className="suit-head">What this unit covers</p>
      <ul className="guide-list">
        {sections.map((section) => {
          const complete = isSectionComplete(progress, section.nodeIds);
          return (
            <li key={section.section} className={complete ? "guide-row is-done" : "guide-row"}>
              <span className="section-id">
                {section.kind === "recap"
                  ? "Recap"
                  : section.kind === "cumulative"
                    ? "Review"
                    : `S${section.section}`}
              </span>
              <span className="section-card">
                {complete || section.kind !== "standard"
                  ? section.cardName || unit.name
                  : "—"}
              </span>
              {complete ? (
                <span className="tick" aria-hidden="true">
                  ✓
                </span>
              ) : (
                <span className="section-state">
                  {section.nodeIds.length} exercises
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </main>
  );
}
