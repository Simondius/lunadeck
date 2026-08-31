"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import DragChip from "./drag-chip";
import TutorialGhost from "./tutorial-ghost";
import CollectedBadge from "./collected-badge";
import { masterForKey, seededShuffle } from "@/lib/rounds";

// How long one wrong word's pop-out plays before the next one starts.
const POP_MS = 500;
// How long the Continue button takes to fade in once the round is clear.
const CONTINUE_FADE_MS = 500;

function keyed(round) {
  const shuffled = seededShuffle(round.words, round.id);
  return shuffled.map((word, i) => ({ ...word, key: `${round.id}-${i}` }));
}

// Plays one round to completion — one card, a handful of words, drag every
// correct one onto the card, watch the wrong ones pop, hit Continue. Used for
// both a node's first pass and its second-look review of missed rounds (see
// node-session.jsx), which is why it reports {missed} on completion rather
// than deciding for itself what happens next.
//
// Not built on lib/rounds.js's node/instance model: there is no hint, no XP,
// and a round that ends on drag success/failure doesn't fit that shape. See
// docs/draft-alt-path-fool-section.md and docs/decisions/0037.
export default function RoundPlayer({
  cardKey,
  cardName,
  round,
  roundNumber,
  totalRounds,
  secondLook,
  onDone,
  basePath = "/v2",
}) {
  const [activeWords, setActiveWords] = useState(() => keyed(round));
  const [collected, setCollected] = useState([]);
  const [stage, setStage] = useState("playing"); // playing | popping | ready
  // The tutorial only ever applies to a round explicitly marked for it
  // (node 1's first round) and never during a second-look replay — a missed
  // first round doesn't need re-teaching the gesture, just another try.
  const [phase, setPhase] = useState(round.tutorial && !secondLook ? "demo" : "live");
  const cardRef = useRef(null);
  const chipRefs = useRef(new Map());
  const skipResolverRef = useRef(null);
  const continueRef = useRef(null);
  const missedRef = useRef(false);
  // A real, stable ref — not a plain object rebuilt on every render, which
  // would read chipRefs.current at render time, before this render's
  // DragChip ref callbacks have even attached anything to it. TutorialGhost
  // needs the DOM node to already be there when its own layout effect runs
  // right after mount, so this has to be updated by the same ref-attachment
  // mechanism (see chipRef below), not computed inline in the JSX.
  const firstCorrectRef = useRef(null);

  const firstCorrectKey = useMemo(
    () => activeWords.find((w) => w.correct)?.key,
    [activeWords]
  );

  // A tap anywhere resolves whatever skippable animation is in flight. A
  // no-op the rest of the time, since nothing sets the ref during normal
  // play or the demo (which has its own separate skip listener).
  useEffect(() => {
    function onTap() {
      skipResolverRef.current?.();
    }
    window.addEventListener("pointerdown", onTap);
    return () => window.removeEventListener("pointerdown", onTap);
  }, []);

  // Runs a WAAPI animation to completion, but lets a tap jump straight to
  // its end state via .finish() instead of waiting out the duration — the
  // same call either way, so "3 words popping" really does take 3 taps.
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

  function chipRef(key) {
    return (el) => {
      if (el) chipRefs.current.set(key, el);
      else chipRefs.current.delete(key);
      if (key === firstCorrectKey) firstCorrectRef.current = el;
    };
  }

  async function closeOutRound(wrongWords) {
    setStage("popping");
    for (const word of wrongWords) {
      await animateSkippable(
        chipRefs.current.get(word.key),
        [
          { transform: "scale(1)", opacity: 1, offset: 0 },
          { transform: "scale(1.15)", opacity: 1, offset: 0.3 },
          { transform: "scale(0)", opacity: 0, offset: 1 },
        ],
        POP_MS
      );
      setActiveWords((prev) => prev.filter((w) => w.key !== word.key));
    }
    setStage("ready");
  }

  // The "pairs" tier (originally 2 words: one correct, one distractor;
  // 4 as of 0047: two correct, two distractors) is still the simple
  // tier - its last wrong chip's own pop animation (closeOutRound, above)
  // already reads as the round's success beat, so waiting on a Continue
  // tap after it adds a step the mastery tiers' fuller sequence doesn't
  // need. The 6-word tiers still get the button.
  const autoAdvance = round.words.length <= 4;

  // Fires once stage flips to "ready" — useLayoutEffect so the button never
  // paints at full opacity even for a frame before the fade takes over.
  useLayoutEffect(() => {
    if (stage !== "ready") return;
    if (autoAdvance) {
      onDone({ missed: missedRef.current });
      return;
    }
    animateSkippable(continueRef.current, [{ opacity: 0 }, { opacity: 1 }], CONTINUE_FADE_MS);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage]);

  function handleAccepted(word) {
    const startRect = chipRefs.current.get(word.key)?.getBoundingClientRect() ?? null;
    setCollected((prev) => [
      ...prev,
      { key: word.key, text: word.text, slotIndex: prev.length, startRect },
    ]);

    const remaining = activeWords.filter((w) => w.key !== word.key);
    setActiveWords(remaining);
    if (remaining.filter((w) => w.correct).length === 0) {
      closeOutRound(remaining);
    }
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
        <div className="reference-card is-compact drag-reference-card">
          <p className="reference-name">{cardName}</p>
          <div ref={cardRef} className="reference-art drag-target">
            <img src={masterForKey(cardKey)} alt={cardName} />
          </div>
        </div>

        {/* Siblings of the card, not children of .reference-art — that div
            is overflow:hidden and briefly picks up a transform of its own
            during the reject shake, either of which could trap a
            position:fixed badge instead of letting it float free. */}
        {collected.map((badge) => (
          <CollectedBadge
            key={badge.key}
            text={badge.text}
            startRect={badge.startRect}
            slotIndex={badge.slotIndex}
            cardRef={cardRef}
          />
        ))}

        <div className="drag-layout-spacer" aria-hidden="true" />

        <div className="chips drag-chips">
          {activeWords.map((word) => (
            <DragChip
              key={word.key}
              ref={chipRef(word.key)}
              word={word}
              cardRef={cardRef}
              disabled={stage !== "playing"}
              onAccepted={handleAccepted}
              onRejected={() => {
                missedRef.current = true;
              }}
            />
          ))}
          {stage === "ready" && !autoAdvance ? (
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

      {phase === "demo" ? (
        <TutorialGhost
          chipRef={firstCorrectRef}
          cardRef={cardRef}
          text={activeWords.find((w) => w.correct)?.text ?? ""}
          onDone={() => setPhase("live")}
        />
      ) : null}
    </main>
  );
}
