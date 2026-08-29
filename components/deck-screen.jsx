"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useProgress } from "@/components/use-progress";
import { isSectionComplete } from "@/lib/progress";

// A card is known once the section that teaches it is finished — the same rule
// the path and unit screens use, so the three never disagree.
function knownKeys(progress, sections) {
  const known = new Set();
  for (const section of sections) {
    if (section.cardKey && isSectionComplete(progress, section.nodeIds)) {
      known.add(section.cardKey);
    }
  }
  return known;
}

export default function DeckScreen({ groups, sections }) {
  const progress = useProgress();
  const [filter, setFilter] = useState("all");

  const known = useMemo(() => knownKeys(progress, sections), [progress, sections]);
  const total = groups.reduce((n, g) => n + g.cards.length, 0);
  const shown = filter === "all" ? groups : groups.filter((g) => g.id === filter);

  const filters = [
    { id: "all", label: "All" },
    ...groups.map((g) => ({ id: g.id, label: g.id === "majors" ? "Majors" : g.label })),
  ];

  return (
    <main className="shell">
      <div className="masthead">
        <div>
          <h1 className="unit-title">Your deck</h1>
        </div>
        <span className="deck-count">
          <b>{known.size}</b> / {total}
        </span>
      </div>

      <p className="standfirst">
        {known.size === 0
          ? "Finish a section and its card lands here"
          : "Tap a card you know to read it in full"}
      </p>

      <div className="filters">
        {filters.map((f) => (
          <button
            key={f.id}
            type="button"
            className={filter === f.id ? "filter is-active" : "filter"}
            onClick={() => setFilter(f.id)}
            aria-pressed={filter === f.id}
          >
            {f.label}
          </button>
        ))}
      </div>

      {shown.map((group) => (
        <section key={group.id}>
          <p className="suit-head">
            {group.label} · {group.cards.filter((c) => known.has(c.key)).length} of{" "}
            {group.cards.length}
          </p>
          <div className="collection">
            {group.cards.map((card) =>
              known.has(card.key) ? (
                <Link
                  key={card.key}
                  className="slot"
                  href={`/deck/${card.key}`}
                  aria-label={card.name}
                >
                  <img src={card.circle} alt="" />
                </Link>
              ) : (
                <span
                  key={card.key}
                  className="slot is-empty"
                  title={`${card.name} — not learned yet`}
                >
                  {card.short}
                </span>
              )
            )}
          </div>
        </section>
      ))}

    </main>
  );
}
