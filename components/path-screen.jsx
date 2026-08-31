"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useProgress } from "@/components/use-progress";
import Flame from "@/components/flame";
import { countComplete, isSectionComplete } from "@/lib/progress";

function Lock() {
  return (
    <svg className="trail-lock" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M17 9V7a5 5 0 0 0-10 0v2a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2Zm-8-2a3 3 0 0 1 6 0v2H9V7Z" />
    </svg>
  );
}

// The trail winds rather than running straight down. Eight offsets, cycled by
// position, which reads as a path without needing any geometry.
const WIND = [0, 40, 62, 40, 0, -40, -62, -40];

function label(section) {
  if (!section) return "";
  if (section.kind === "recap") return "Recap";
  if (section.kind === "cumulative") return "Review";
  return `S${section.section}`;
}

export default function PathScreen({ entries, totalNodes }) {
  const progress = useProgress();
  const [collapsed, setCollapsed] = useState(() => new Set());

  // The path arrives flat — a unit banner followed by its sections. Grouping it
  // is what lets a unit fold away.
  const groups = useMemo(() => {
    const out = [];
    for (const entry of entries) {
      if (entry.type === "unit") out.push({ unit: entry, sections: [] });
      else if (out.length) out[out.length - 1].sections.push(entry);
    }
    return out;
  }, [entries]);

  const sections = useMemo(() => groups.flatMap((g) => g.sections), [groups]);
  const done = sections.map((s) => isSectionComplete(progress, s.nodeIds));
  const currentIndex = done.indexOf(false);
  const current = currentIndex === -1 ? sections.length - 1 : currentIndex;

  const completedNodes = sections.reduce(
    (sum, s) => sum + countComplete(progress, s.nodeIds),
    0
  );
  const currentSection = sections[current];

  const toggle = (unit) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      next.has(unit) ? next.delete(unit) : next.add(unit);
      return next;
    });

  let index = -1;

  return (
    <main className="shell starfield">
      {/* No wordmark. This is the screen people open every day — it should be
          about where they are, not about the brand, and the tab bar and page
          title already say which app this is. */}
      <header className="statusbar">
        <div>
          <span className="statusbar-where">
            Unit {currentSection?.unit ?? 1} · {label(currentSection)}
          </span>
          {/* Exercises, not "cards known". A card counted as known still has a
              median of ten more encounters ahead of it, so that word overstated
              by about 60% — and it only reached 78 at 99% of the way through,
              making it a coarser copy of this number. */}
          <span className="statusbar-count">
            {completedNodes} of {totalNodes} exercises
          </span>
        </div>

        {/* Flame and number only. Labelled as one element so a screen reader
            still hears "3 day streak" rather than a bare number beside a
            decorative flame. */}
        <div
          className="streak"
          role="img"
          aria-label={`${progress.streakDays} day streak`}
        >
          <Flame />
          <span className="streak-count">{progress.streakDays}</span>
        </div>
      </header>

      <div
        className="overall"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={totalNodes}
        aria-valuenow={completedNodes}
      >
        <div
          className="overall-fill"
          style={{ width: totalNodes ? `${(completedNodes / totalNodes) * 100}%` : "0%" }}
        />
      </div>

      <div className="trail">
        {groups.map(({ unit, sections: rows }) => {
          const shut = collapsed.has(unit.unit);
          const unitDone = rows.filter((s) => isSectionComplete(progress, s.nodeIds)).length;

          return (
            <section key={`u${unit.unit}`}>
              {/* The whole heading is the button. It could not be, while a
                  Guidebook link sat inside it — one interactive element must
                  not nest in another — so the panel had to come apart into a
                  row of controls, and it stopped reading as a thing you press.
                  With the link gone (0023) the panel can be a single control
                  again, which is what it always looked like it was.

                  No description here: it belongs to a unit, not to the stretch
                  of path below it, and every unit carrying one turned the
                  scroll into a wall of blurb. */}
              <button
                type="button"
                className={shut ? "trail-unit is-shut" : "trail-unit"}
                onClick={() => toggle(unit.unit)}
                aria-expanded={!shut}
                aria-controls={`unit-${unit.unit}-sections`}
              >
                <span className="trail-unit-index">
                  {unitDone} of {rows.length}
                </span>
                <span className="trail-unit-name">{unit.name}</span>
                <span className="trail-chevron" aria-hidden="true" />
              </button>

              <ol className="trail-steps" id={`unit-${unit.unit}-sections`} hidden={shut}>
                {rows.map((entry) => {
                  index += 1;
                  const i = index;
                  const isDone = done[i];
                  const isCurrent = i === current && !isDone;
                  const locked = !isDone && !isCurrent;
                  const classes = ["trail-step"];
                  if (entry.kind !== "standard") classes.push("is-recap");
                  if (isDone) classes.push("is-done");
                  if (isCurrent) classes.push("is-current");
                  if (locked) classes.push("is-locked");

                  const body = (
                    <>
                      <span className="trail-node">
                        {entry.image ? <img src={entry.image} alt="" /> : null}
                        {isDone ? (
                          <span className="trail-tick" aria-hidden="true">
                            ✓
                          </span>
                        ) : null}
                        {locked ? (
                          <span className="trail-locked-badge" aria-hidden="true">
                            <Lock />
                          </span>
                        ) : null}
                      </span>
                      <span className="trail-label">
                        {entry.cardName ?? `Unit ${entry.unit} ${label(entry)}`}
                      </span>
                      <span className="trail-sub">{label(entry)}</span>
                    </>
                  );

                  const href = `/units/${entry.unit}/sections/${encodeURIComponent(
                    entry.section
                  )}/play`;
                  const style = { "--x": `${WIND[i % WIND.length]}px` };

                  return (
                    <li key={`${entry.unit}-${entry.section}`}>
                      {locked ? (
                        <span className={classes.join(" ")} style={style}>
                          {body}
                        </span>
                      ) : (
                        <Link className={classes.join(" ")} href={href} style={style}>
                          {body}
                        </Link>
                      )}
                    </li>
                  );
                })}
              </ol>
            </section>
          );
        })}
      </div>
    </main>
  );
}
