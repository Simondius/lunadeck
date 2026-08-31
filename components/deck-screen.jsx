"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useProgress } from "@/components/use-progress";
import { knownCardKeys } from "@/lib/progress";

export default function DeckScreen({ groups, sections }) {
  const progress = useProgress();
  const [filter, setFilter] = useState("all");

  const known = useMemo(() => knownCardKeys(progress, sections), [progress, sections]);
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
          ? "Tap any card to go and learn it"
          : "Tap any card — read it, or go and learn it"}
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
            {/* Every card opens, learned or not. Hiding the art here was
                protecting nothing — the path shows the same circles, greyed,
                for sections nobody has reached — and it left a learner who
                came looking for one particular card facing a grid of numbers.
                Unlearned cards are greyed the way the path greys them, and
                lead to an entry that says where the card is taught. */}
            {group.cards.map((card) => (
              <Link
                key={card.key}
                className={known.has(card.key) ? "card-slot" : "card-slot is-locked"}
                href={`/deck/${card.key}`}
              >
                <span className="slot">
                  <img src={card.circle} alt="" />
                </span>
                <span className="slot-name">{card.name}</span>
              </Link>
            ))}
          </div>
        </section>
      ))}

    </main>
  );
}
