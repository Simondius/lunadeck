"use client";

import Link from "next/link";
import { useProgress } from "@/components/use-progress";
import { countFirstTry, isSectionComplete } from "@/lib/progress";

// The screen that closes a lesson. Two variants of one layout: a section ends
// with the card you earned and a strip of the unit's sections; a unit recap
// ends with every card the unit taught and a teaser for the next one.
export default function Complete({ completion, nodeIds }) {
  const progress = useProgress();
  const {
    kind,
    unitNumber,
    sectionLabel,
    card,
    unitCards,
    nextUnit,
    sections,
    nextSection,
  } = completion;

  const firstTry = countFirstTry(progress, nodeIds);
  const total = nodeIds.length;
  const missed = total - firstTry;

  const knownCards = sections.filter(
    (s) => s.cardKey && isSectionComplete(progress, s.nodeIds)
  ).length;

  const title =
    kind === "unit"
      ? ["Unit " + unitNumber, "complete"]
      : [card?.name ?? sectionLabel, "is yours"];

  const continueHref =
    kind === "unit"
      ? nextUnit
        ? `/units/${nextUnit.number}`
        : "/"
      : nextSection
        ? `/units/${unitNumber}/sections/${encodeURIComponent(nextSection)}/play`
        : `/units/${unitNumber}`;

  const continueLabel =
    kind === "unit"
      ? nextUnit
        ? `Start Unit ${nextUnit.number}`
        : "Back to the path"
      : nextSection
        ? "Next section"
        : "Back to the unit";

  return (
    <main className="complete">
      <span className="complete-eyebrow">
        {kind === "unit" ? `Unit ${unitNumber} recap complete` : `${sectionLabel} complete`}
      </span>

      <h1 className="complete-title">
        {title[0]}
        <br />
        {title[1]}
      </h1>

      {/* A recap is one node covering the whole unit, so "0 of 1 right first
          time" would be a nonsense stat. Spec_MainPath reports cards there
          instead — "8/8 cards in this unit". */}
      <p className="complete-body">
        {kind === "unit" ? (
          <>All {unitCards.length} cards in this unit are yours.</>
        ) : (
          <>
            {firstTry} of {total} right first time.
            {missed > 0
              ? ` The ${missed === 1 ? "one" : missed} you missed will come back around.`
              : " A clean run."}
          </>
        )}
      </p>

      {kind === "unit" ? (
        <div className="earned">
          {unitCards.map((c) => (
            <span key={c.key} className="slot" title={c.name}>
              <img src={c.image} alt={c.name} />
            </span>
          ))}
        </div>
      ) : card ? (
        <div className="complete-card">
          <img src={card.image} alt={card.name} />
        </div>
      ) : null}

      <div className="scoreboard">
        <div className="score">
          <span className="score-value">{progress.streakDays}</span>
          <span className="score-label">Nights</span>
        </div>
        <div className="score is-accent">
          <span className="score-value">{knownCards}</span>
          <span className="score-label">Cards</span>
        </div>
        <div className="score">
          <span className="score-value">{progress.xp}</span>
          <span className="score-label">XP</span>
        </div>
      </div>

      {kind === "unit" && nextUnit ? (
        <div className="unlock">
          {nextUnit.icon ? <img src={nextUnit.icon} alt="" /> : null}
          <span>
            <span className="unlock-label">Unit {nextUnit.number} unlocked</span>
            <span className="section-card">{nextUnit.name}</span>
            <span className="section-note">
              {nextUnit.cardCount} cards · {nextUnit.nodeCount} exercises
            </span>
          </span>
        </div>
      ) : (
        <div className="progress" aria-label="Sections in this unit">
          {sections.map((s) => (
            <span
              key={s.section}
              className={isSectionComplete(progress, s.nodeIds) ? "is-done" : undefined}
            />
          ))}
        </div>
      )}

      <footer className="footer">
        <Link className="action" href={continueHref}>
          {continueLabel}
        </Link>
        <Link className="action-quiet" href="/">
          Back to the path
        </Link>
      </footer>
    </main>
  );
}
