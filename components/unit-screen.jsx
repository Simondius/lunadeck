"use client";

import Link from "next/link";
import { useProgress } from "@/components/use-progress";
import { countComplete, isSectionComplete } from "@/lib/progress";

// What a section actually drills, in the learner's words rather than format
// codes. Capped at three so the note stays on one line.
const WHAT = {
  A1: "keywords",
  A2: "meanings",
  A3: "arcana sort",
  A4: "symbols",
  A5: "symbols",
  A7: "symbols",
  B: "true/false",
  C: "matching",
};

function describe(formats) {
  const seen = [];
  for (const code of formats) {
    const word = WHAT[code];
    if (word && !seen.includes(word)) seen.push(word);
  }
  return seen.slice(0, 3).join(", ");
}

function label(section) {
  if (section.kind === "recap") return "Recap";
  if (section.kind === "cumulative") return "Review";
  return `S${section.section}`;
}

// The row uses the short form; the resume button has room to spell it out.
function longLabel(section) {
  if (section.kind === "recap") return "the recap";
  if (section.kind === "cumulative") return "the review";
  return `Section ${section.section}`;
}

export default function UnitScreen({ unit, sections, cards }) {
  const progress = useProgress();

  const rows = sections.map((section) => {
    const done = countComplete(progress, section.nodeIds);
    return { ...section, done, complete: isSectionComplete(progress, section.nodeIds) };
  });

  const currentIndex = rows.findIndex((s) => !s.complete);
  const current = currentIndex === -1 ? null : currentIndex;

  const known = new Set(
    rows.filter((s) => s.complete && s.cardKey).map((s) => s.cardKey)
  );

  const sectionsDone = rows.filter((s) => s.complete).length;
  const nodesLeft = rows.reduce((n, s) => n + (s.nodeIds.length - s.done), 0);
  const minutesLeft = Math.max(0, Math.round((nodesLeft * 90) / 60));
  const resume = current === null ? null : rows[current];

  return (
    <main className="shell has-action">
      <Link className="backlink" href="/">
        ← Path
      </Link>

      <span className="unit-eyebrow">
        Unit {unit.number} · {sections.length} sections
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
            {sectionsDone}/{sections.length}
          </span>
          <span className="stat-label">Sections</span>
        </div>
        <div>
          <span className="stat-value">{nodesLeft}</span>
          <span className="stat-label">Exercises left</span>
        </div>
        <div>
          <span className="stat-value">{minutesLeft}</span>
          <span className="stat-label">Minutes left</span>
        </div>
      </div>

      <div className="sections">
        {rows.map((section, index) => {
          const isCurrent = index === current;
          const locked = current !== null && index > current;
          const classes = ["section-row"];
          if (section.kind !== "standard") classes.push("is-recap");
          if (isCurrent) classes.push("is-current");
          if (locked) classes.push("is-locked");

          const body = (
            <>
              <span className="section-id">{label(section)}</span>
              <span>
                <span className="section-card">
                  {section.cardName || unit.name}
                </span>
                <span className="section-note">
                  {section.nodeIds.length} exercise
                  {section.nodeIds.length === 1 ? "" : "s"}
                  {describe(section.formats) ? ` · ${describe(section.formats)}` : ""}
                </span>
                {isCurrent && section.done > 0 ? (
                  <span className="section-bar">
                    <span
                      style={{
                        width: `${(section.done / section.nodeIds.length) * 100}%`,
                      }}
                    />
                  </span>
                ) : null}
              </span>
              {section.complete ? (
                <span className="tick" aria-hidden="true">
                  ✓
                </span>
              ) : (
                <span className={isCurrent ? "section-state is-play" : "section-state"}>
                  {isCurrent ? "Play" : locked ? "Locked" : ""}
                </span>
              )}
            </>
          );

          return locked ? (
            <div key={section.section} className={classes.join(" ")}>
              {body}
            </div>
          ) : (
            <Link
              key={section.section}
              className={classes.join(" ")}
              href={`/units/${unit.number}/sections/${encodeURIComponent(
                section.section
              )}/play`}
            >
              {body}
            </Link>
          );
        })}
      </div>

      {resume ? (
        <Link
          className="start"
          href={`/units/${unit.number}/sections/${encodeURIComponent(
            resume.section
          )}/play`}
        >
          <span>
            {resume.done > 0 ? "Resume" : "Start"} {longLabel(resume)}
            {resume.kind === "standard" && resume.cardName
              ? ` · ${resume.cardName}`
              : ""}
          </span>
        </Link>
      ) : (
        <div className="start">
          <span>Unit complete</span>
        </div>
      )}
    </main>
  );
}
