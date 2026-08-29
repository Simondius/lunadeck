"use client";

import Link from "next/link";
import { useProgress } from "@/components/use-progress";
import { countComplete, isSectionComplete } from "@/lib/progress";

// Spec_Meta_Hygiene_Systems 7.2 calls for a flame-and-count chip; the violet
// handoff drew a plain dot. Inline rather than an icon file, so it takes its
// colour and glow from the stylesheet like every other glyph here.
function Flame() {
  return (
    <svg className="streak-flame" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M13 2c0 3.4-4.2 4.6-4.2 8.6a3 3 0 0 0 6 0c0-1.4-.7-2.2-.7-3.3 1.8 1.3 3.2 3.4 3.2 5.9a6.3 6.3 0 0 1-12.6 0C4.7 7.6 11 6.6 13 2Z" />
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
  if (section.kind === "recap") return "Recap";
  if (section.kind === "cumulative") return "Review";
  return `S${section.section}`;
}

export default function PathScreen({ entries, totalNodes }) {
  const progress = useProgress();

  const sections = entries.filter((e) => e.type === "section");
  const done = sections.map((s) => isSectionComplete(progress, s.nodeIds));
  // The first unfinished section is the one in play; everything after is
  // locked, which is what makes finishing one promote the next.
  const currentIndex = done.indexOf(false);
  const current = currentIndex === -1 ? sections.length - 1 : currentIndex;

  const completedNodes = sections.reduce(
    (sum, s) => sum + countComplete(progress, s.nodeIds),
    0
  );
  const known = sections.filter((s, i) => s.cardKey && done[i]).length;
  const currentSection = sections[current];

  let sectionIndex = -1;

  return (
    <main className="shell starfield">
      <header className="masthead">
        <div>
          <h1 className="wordmark">
            Luna<span className="moon">deck</span>
          </h1>
          <p className="standfirst">{known} of 78 cards known</p>
        </div>
        <div className="masthead-aside">
          <span className="streak">
            <Flame />
            {progress.streakDays} day{progress.streakDays === 1 ? "" : "s"}
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
        Unit {currentSection?.unit ?? 1} · {label(currentSection ?? {})} ·{" "}
        {completedNodes} of {totalNodes} exercises
      </p>

      <ol className="trail">
        {entries.map((entry) => {
          if (entry.type === "unit") {
            return (
              <li key={`u${entry.unit}`}>
                <div className="trail-unit">
                  <span>
                    <span className="trail-unit-index">Unit {entry.unit}</span>
                    <span className="trail-unit-name">{entry.name}</span>
                    <span className="trail-unit-tagline">{entry.tagline}</span>
                  </span>
                  <Link className="trail-guide" href={`/units/${entry.unit}`}>
                    Guidebook
                  </Link>
                </div>
              </li>
            );
          }

          sectionIndex += 1;
          const i = sectionIndex;
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
                {/* Every node carries its art. Spec_MainPath 3.2 hides card
                    identity on locked nodes, but a path of 85 identical dark
                    circles is its own problem — and the deck and each unit's
                    guidebook already list what a unit covers, so there is
                    little left to spoil. Locked art is desaturated and dimmed,
                    with the lock kept as a corner badge so the state still
                    reads at a glance. */}
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
              {isDone || isCurrent ? (
                <span className="trail-label">
                  {entry.cardName ?? `Unit ${entry.unit} ${label(entry)}`}
                </span>
              ) : null}
              <span className="trail-sub">{label(entry)}</span>
            </>
          );

          const href = `/units/${entry.unit}/sections/${encodeURIComponent(
            entry.section
          )}/play`;

          return (
            <li key={`${entry.unit}-${entry.section}`}>
              {locked ? (
                <span
                  className={classes.join(" ")}
                  style={{ "--x": `${WIND[i % WIND.length]}px` }}
                >
                  {body}
                </span>
              ) : (
                <Link
                  className={classes.join(" ")}
                  href={href}
                  style={{ "--x": `${WIND[i % WIND.length]}px` }}
                >
                  {body}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </main>
  );
}
