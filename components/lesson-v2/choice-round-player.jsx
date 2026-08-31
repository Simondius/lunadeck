"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import DragChip from "./drag-chip";
import { masterForKey, seededShuffle } from "@/lib/rounds";

const CONTINUE_FADE_MS = 500;

// Plays one "choice" round: drag the one true reading onto the card, same
// gesture as every other round type in v2 — this used to be tap-one-of-4,
// but Simon's call after playtesting was that switching mechanics for one
// round type broke the rhythm the rest of the section teaches. Reusing
// DragChip directly (rather than a parallel implementation) means a wrong
// drop already behaves exactly like a keyword round's wrong drop: the card
// flashes and shakes, the chip snaps back, and it's still there to retry.
// Reports {missed}, same contract as every other round type — see
// node-session.jsx and docs/decisions/0035.
export default function ChoiceRoundPlayer({
  cardKey,
  cardName,
  round,
  roundNumber,
  totalRounds,
  onDone,
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
  const [stage, setStage] = useState("playing"); // playing | ready
  const cardRef = useRef(null);
  const skipResolverRef = useRef(null);
  const continueRef = useRef(null);
  const missedRef = useRef(false);

  useEffect(() => {
    function onTap() {
      skipResolverRef.current?.();
    }
    window.addEventListener("pointerdown", onTap);
    return () => window.removeEventListener("pointerdown", onTap);
  }, []);

  function animateSkippable(el, keyframes, duration) {
    return new Promise((resolve) => {
      if (!el) {
        resolve();
        return;
      }
      const animation = el.animate(keyframes, { duration, easing: "ease", fill: "forwards" });
      skipResolverRef.current = () => animation.finish();
      animation.onfinish = () => {
        skipResolverRef.current = null;
        resolve();
      };
    });
  }

  useLayoutEffect(() => {
    if (stage === "ready") {
      animateSkippable(continueRef.current, [{ opacity: 0 }, { opacity: 1 }], CONTINUE_FADE_MS);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage]);

  return (
    <main className="session is-drag-lesson">
      <div className="topbar">
        <Link className="quit" href="/v2" aria-label="Leave lesson">
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
        <p className="prompt">{round.prompt}</p>

        <div className="reference-card is-compact drag-reference-card choice-reference-card">
          <p className="reference-name">{cardName}</p>
          <div ref={cardRef} className="reference-art drag-target">
            <img src={masterForKey(cardKey)} alt={cardName} />
          </div>
        </div>

        <div className="drag-layout-spacer" aria-hidden="true" />

        <div className="chips drag-chips">
          {options.map((word) => (
            <DragChip
              key={word.listKey}
              word={word}
              long
              cardRef={cardRef}
              disabled={stage !== "playing"}
              onAccepted={() => setStage("ready")}
              onRejected={() => {
                missedRef.current = true;
              }}
            />
          ))}
          {stage === "ready" ? (
            <button
              ref={continueRef}
              type="button"
              className="action"
              style={{ opacity: 0 }}
              onClick={() => onDone({ missed: missedRef.current })}
            >
              Continue
            </button>
          ) : null}
        </div>

        <div className="drag-layout-spacer" aria-hidden="true" />
      </div>
    </main>
  );
}
