"use client";

import Link from "next/link";
import { useProgress } from "@/components/use-progress";
import { countComplete, isSectionComplete, today } from "@/lib/progress";

// Minutes left, at the curriculum's own "typical" pace of 90s per node.
function minutesFor(nodeCount) {
  return Math.max(1, Math.round((nodeCount * 90) / 60));
}

export default function PathScreen({ units, totalNodes }) {
  const progress = useProgress();

  // Counted against the nodes that actually exist, not unit_metadata's
  // total_node_count — one stale cell there would leave a finished unit
  // permanently incomplete and lock every unit after it.
  const rows = units.map((unit) => {
    const total = unit.nodeIds.length;
    const done = countComplete(progress, unit.nodeIds);
    return { ...unit, total, done, complete: total > 0 && done === total };
  });

  // The first unit that isn't finished is the one in play; everything after it
  // is locked, exactly as finishing a recap promotes the next unit.
  const currentIndex = rows.findIndex((u) => !u.complete);
  const current = currentIndex === -1 ? rows.length - 1 : currentIndex;

  const completedNodes = rows.reduce((sum, u) => sum + u.done, 0);

  const knownCards = new Set();
  for (const unit of units) {
    for (const section of unit.sections) {
      if (section.cardKey && isSectionComplete(progress, section.nodeIds)) {
        knownCards.add(section.cardKey);
      }
    }
  }

  const unit = rows[current] ?? null;
  if (!unit) return null;
  const activeSection =
    unit?.sections.find((s) => !isSectionComplete(progress, s.nodeIds)) ??
    unit?.sections.at(-1);

  const drawReady = progress.lastDrawDate !== today();

  return (
    <main className="shell starfield">
      <header className="masthead">
        <div>
          <h1 className="wordmark">
            Luna<span className="moon">deck</span>
          </h1>
          <p className="standfirst">
            {knownCards.size} of 78 cards known
          </p>
        </div>
        <div className="masthead-aside">
          <span className="streak">
            <span className="streak-dot" aria-hidden="true" />
            {progress.streakDays} day{progress.streakDays === 1 ? "" : "s"}
          </span>
          <p className="standfirst">
            {drawReady ? "Daily draw ready" : "Drawn for today"}
          </p>
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
        Unit {unit.number} · Section {activeSection?.section ?? "1"} ·{" "}
        {completedNodes} of {totalNodes} exercises
      </p>

      <ol className="path">
        {rows.map((row, index) => {
          const state =
            row.complete ? "is-done" : index === current ? "is-current" : index < current ? "is-done" : "is-locked";
          const locked = state === "is-locked";
          const ratio = row.total ? row.done / row.total : 0;

          const body = (
            <>
              <span className="stop-art" style={{ "--p": ratio }}>
                {row.icon ? <img src={row.icon} alt="" /> : null}
                {row.complete ? (
                  <span className="stop-tick" aria-hidden="true">
                    ✓
                  </span>
                ) : null}
              </span>
              <span className="stop-body">
                <span className="stop-index">
                  Unit {row.number}
                  {index === current && !row.complete ? " · in play" : ""}
                </span>
                <span className="stop-name">{row.name}</span>
                <span className="stop-tagline">{row.tagline}</span>
                <span className="stop-meta">
                  {locked
                    ? row.unlockRequirement
                    : `${row.done} / ${row.total} · ${row.cardCount} cards`}
                </span>
                {index === current && !row.complete ? (
                  <span className="stop-cta">
                    {row.done ? "Continue" : "Start"} ·{" "}
                    {minutesFor(row.total - row.done)} min
                  </span>
                ) : null}
              </span>
            </>
          );

          return (
            <li key={row.number}>
              {locked ? (
                <span className={`stop ${state}`}>{body}</span>
              ) : (
                <Link className={`stop ${state}`} href={`/units/${row.number}`}>
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
