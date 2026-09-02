"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { masterForKey, seededShuffle } from "@/lib/rounds";

const WRONG_FLASH_MS = 460;
const CORRECT_ADVANCE_MS = 500;

// Plays one "choice" round: tap the one true reading, not drag it onto the
// card (docs/decisions/0066 — Simon's own call, replacing 0035's original
// "reuse DragChip so every round type shares one gesture" reasoning: a
// pick-one-of-four multiple choice reads more naturally as a tap than a
// drag, and Story mode's own narrative choices already establish exactly
// this tap-and-feedback language elsewhere in the app). A wrong tap shakes
// and tints red *permanently* — it stays disabled rather than resetting,
// same as a wrong narrative choice (chapter-player.jsx's own eliminatedKeys,
// 0056) — so a repeat guess isn't possible. A correct tap sparkles while
// every other option fades away, then the round advances on its own after
// CORRECT_ADVANCE_MS — no Continue button to tap, since there's nothing
// left to decide once the right answer is already picked. Reports
// {missed}, same contract as every other round type — see node-session.jsx.
export default function ChoiceRoundPlayer({
  cardKey,
  cardName,
  round,
  roundNumber,
  totalRounds,
  onDone,
  basePath = "/v2",
}) {
  const options = useMemo(
    () =>
      seededShuffle(round.options, round.id).map((text, i) => ({
        text,
        correct: text === round.correct,
        listKey: `${round.id}-${i}`,
      })),
    [round]
  );
  // The exact wrong option currently mid-shake, separate from
  // eliminatedKeys below — flashKey clears itself once the shake plays;
  // eliminatedKeys doesn't, matching chapter-player.jsx's own
  // flashKey/eliminatedKeys split (0056).
  const [flashKey, setFlashKey] = useState(null);
  const [eliminatedKeys, setEliminatedKeys] = useState(() => new Set());
  const [correctKey, setCorrectKey] = useState(null);
  const missedRef = useRef(false);

  function tryOption(option) {
    if (correctKey || eliminatedKeys.has(option.listKey)) return;
    if (option.correct) {
      setCorrectKey(option.listKey);
      window.setTimeout(() => onDone({ missed: missedRef.current }), CORRECT_ADVANCE_MS);
      return;
    }
    missedRef.current = true;
    setFlashKey(option.listKey);
    setEliminatedKeys((prev) => new Set(prev).add(option.listKey));
    window.setTimeout(() => setFlashKey(null), WRONG_FLASH_MS);
  }

  return (
    <main className="session is-drag-lesson">
      <div className="topbar">
        <Link className="quit" href={basePath} aria-label="Leave lesson">
          ✕
        </Link>
        <div
          className="progress"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={totalRounds}
          aria-valuenow={roundNumber - 1}
          aria-label={`Round ${roundNumber} of ${totalRounds}`}
        >
          {Array.from({ length: totalRounds }, (_, i) => (
            <span key={i} className={i < roundNumber - 1 ? "is-done" : undefined} />
          ))}
        </div>
      </div>

      <div className="drag-layout">
        {/* A leading spacer, mirroring the trailing one below - every
            round player was missing this (docs/decisions/0066, "center
            the content vertically... fix for all nodes"): a single
            trailing spacer only pushes the *rest* of the layout down
            from a fixed top, it doesn't center the whole block. */}
        <div className="drag-layout-spacer" aria-hidden="true" />

        <p className="prompt">{round.prompt}</p>

        <div className="reference-card is-compact drag-reference-card choice-reference-card">
          <p className="reference-name">{cardName}</p>
          <div className="reference-art">
            <img src={masterForKey(cardKey)} alt={cardName} />
          </div>
        </div>

        <div className="drag-layout-spacer" aria-hidden="true" />

        <div className="choice-select-options">
          {options.map((option) => {
            const isEliminated = eliminatedKeys.has(option.listKey);
            const isCorrectPick = correctKey === option.listKey;
            const isFadingOut = correctKey != null && !isCorrectPick;
            return (
              <button
                key={option.listKey}
                type="button"
                disabled={isEliminated || correctKey != null}
                className={
                  "choice-select-option" +
                  (flashKey === option.listKey ? " is-wrong" : "") +
                  (isEliminated ? " is-eliminated" : "") +
                  (isCorrectPick ? " is-correct-pick" : "") +
                  (isFadingOut ? " is-fading-out" : "")
                }
                onClick={() => tryOption(option)}
              >
                {option.text}
              </button>
            );
          })}
        </div>

        <div className="drag-layout-spacer" aria-hidden="true" />
      </div>
    </main>
  );
}
