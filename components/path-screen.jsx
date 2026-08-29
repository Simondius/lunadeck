"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useProgress } from "@/components/use-progress";
import { countComplete, isSectionComplete } from "@/lib/progress";

// Spec_Meta_Hygiene_Systems 7.2 calls for a flame-and-count chip. Inline rather
// than an icon file so it takes its colour, glow and flicker from the
// stylesheet — see .streak-flame.
// Two paths, not one: an outer body with a couple of licks, and a hotter inner
// core. The core is what makes it read as fire rather than a droplet at a
// glance, and it is what runs blue when the flame catches — which is the way
// round a real flame does it.
function Flame() {
  return (
    <svg className="streak-flame" viewBox="0 0 24 24" aria-hidden="true">
      <path
        className="flame-body"
        d="M13.4 1.2c1 3.4-1.1 5-2.9 6.9-2 2.1-3.3 4-3.3 6.6a6.8 6.8 0 0 0 13.6 0c0-2.4-.9-4.2-2.2-5.8-.7-.9-1.3-1.7-1.5-2.7-1.3 1.1-1.8 2.6-1.5 4.3-1.9-1.5-2.9-3.7-2.9-6.2-1.3 1.7-1.7 3.5-1.1 5.5-1.9-2.3-2.1-5.4 1.8-8.6Z"
      />
      <path
        className="flame-core"
        d="M13.9 8.6c.4 2.2 2.6 3.4 2.6 5.8a3.3 3.3 0 0 1-6.6 0c0-1.9 1.3-2.9 2-4.4.3 1 .4 1.9.1 2.9 1.1-1 1.8-2.6 1.9-4.3Z"
      />
    </svg>
  );
}

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
  const known = sections.filter((s, i) => s.cardKey && done[i]).length;
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
      <header className="masthead">
        <div>
          <h1 className="wordmark">
            Luna<span className="moon">deck</span>
          </h1>
          <p className="standfirst">{known} of 78 cards known</p>
        </div>

        <div className="streak">
          <Flame />
          <span className="streak-count">{progress.streakDays}</span>
          <span className="streak-label">
            day{progress.streakDays === 1 ? "" : "s"}
          </span>
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
      <p className="overall-note">
        Unit {currentSection?.unit ?? 1} · {label(currentSection)} ·{" "}
        {completedNodes} of {totalNodes} exercises
      </p>

      <div className="trail">
        {groups.map(({ unit, sections: rows }) => {
          const shut = collapsed.has(unit.unit);
          const unitDone = rows.filter((s) => isSectionComplete(progress, s.nodeIds)).length;

          return (
            <section key={`u${unit.unit}`}>
              <div className="trail-unit">
                <button
                  type="button"
                  className="trail-unit-toggle"
                  onClick={() => toggle(unit.unit)}
                  aria-expanded={!shut}
                  aria-controls={`unit-${unit.unit}-sections`}
                >
                  <span className="trail-unit-index">
                    Unit {unit.unit} · {unitDone}/{rows.length}
                  </span>
                  <span className="trail-unit-name">{unit.name}</span>
                  <span className="trail-unit-tagline">{unit.tagline}</span>
                  <span
                    className={shut ? "trail-chevron is-shut" : "trail-chevron"}
                    aria-hidden="true"
                  />
                </button>
                <Link className="trail-guide" href={`/units/${unit.unit}`}>
                  Guidebook
                </Link>
              </div>

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
                      {isCurrent ? <span className="trail-callout">Start</span> : null}
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
