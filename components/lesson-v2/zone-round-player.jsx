"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import ZoneChip from "./zone-chip";
import ZoneHighlight from "./zone-highlight";
import CollectedBadge from "./collected-badge";
import TutorialGhost from "./tutorial-ghost";
import { masterForKey, seededShuffle } from "@/lib/rounds";

// How long the Continue button takes to fade in once every phrase is placed.
const CONTINUE_FADE_MS = 500;
// Synthetic size for the flashed name label — there's no real chip at this
// position to measure (see nameStartRect), so this is a reasonable guess
// sized loosely to the name's length rather than one fixed box for every
// name from "Uranus" to "Crescent moon".
const NAME_BADGE_HEIGHT = 40;
const NAME_BADGE_GAP = 12;
// Hint: how long the remaining zones stay lit before fading.
const HINT_HOLD_MS = 2000;
const HINT_FADE_MS = 400;

function keyed(round) {
  return seededShuffle(round.elements, round.id).map((el, i) => ({
    ...el,
    listKey: `${round.id}-${i}`,
  }));
}

// Where an element's rects sit as a whole, for positioning the name flash
// above them (and the tutorial's target) — the union of every rect, not just
// the first, since night_sky is two.
function unionBounds(rects) {
  return rects.reduce(
    (acc, r) => ({
      x0: Math.min(acc.x0, r.x0),
      y0: Math.min(acc.y0, r.y0),
      x1: Math.max(acc.x1, r.x1),
      y1: Math.max(acc.y1, r.y1),
    }),
    { x0: 1, y0: 1, x1: 0, y1: 0 }
  );
}

// The percentage box for one rect, as a child of .reference-art — pure CSS,
// no measurement needed, since both this and the card image it's laid over
// share the exact same box.
function rectBoxStyle(rect) {
  return {
    left: `${rect.x0 * 100}%`,
    top: `${rect.y0 * 100}%`,
    width: `${(rect.x1 - rect.x0) * 100}%`,
    height: `${(rect.y1 - rect.y0) * 100}%`,
  };
}

// The inverse-scale trick that makes a small overflow:hidden window act like
// a crop onto the full card image: the image inside is sized as if the
// window were the whole card, then shifted so the window's own top-left
// lands where rect.x0/y0 say it should.
function rectImageStyle(rect) {
  const w = rect.x1 - rect.x0;
  const h = rect.y1 - rect.y0;
  return {
    left: `${(-rect.x0 / w) * 100}%`,
    top: `${(-rect.y0 / h) * 100}%`,
    width: `${(1 / w) * 100}%`,
    height: `${(1 / h) * 100}%`,
    maxWidth: "none",
    maxHeight: "none",
  };
}

// Plays one "zone" round: match each description phrase to the part of the
// card it describes, by dragging it onto that part rather than picking a
// keyword. Reports {missed} on completion, same contract as RoundPlayer, so
// NodeSession's mistake-review queue works identically for both round
// shapes — see node-session.jsx and docs/decisions/0038.
//
// No wrong-distractor chips to pop here: every chip on screen is one of the
// round's real elements, so the round is simply "empty" the moment the last
// one lands, straight to the Continue fade-in.
//
// The card starts desaturated — a plain grayscale <img> — and a correct drop
// opens a permanent colour "window" over that element's own zone (see
// rectBoxStyle/rectImageStyle), on top of the usual celebration: the zone
// glows (ZoneHighlight), and the element's short name flashes above it
// before flying to the left-side stack, the same CollectedBadge component
// and slots the keyword rounds use.
export default function ZoneRoundPlayer({
  cardKey,
  cardName,
  round,
  roundNumber,
  totalRounds,
  secondLook,
  onDone,
  basePath = "/v2",
}) {
  const [remaining, setRemaining] = useState(() => keyed(round));
  const [highlights, setHighlights] = useState([]);
  const [collected, setCollected] = useState([]);
  const [revealed, setRevealed] = useState([]); // rects[], flattened, permanent
  const [hint, setHint] = useState(null); // { rects, fading } | null
  const [stage, setStage] = useState("playing"); // playing | ready
  // Same rule as RoundPlayer: the tutorial only plays when the round is
  // marked for it, and never on a second-look replay.
  const [phase, setPhase] = useState(round.tutorial && !secondLook ? "demo" : "live");
  const cardRef = useRef(null);
  const demoChipRef = useRef(null);
  const skipResolverRef = useRef(null);
  const continueRef = useRef(null);
  const missedRef = useRef(false);
  const highlightCounter = useRef(0);
  const hintTimeouts = useRef([]);

  useEffect(() => {
    function onTap() {
      skipResolverRef.current?.();
    }
    window.addEventListener("pointerdown", onTap);
    return () => window.removeEventListener("pointerdown", onTap);
  }, []);

  useEffect(() => {
    return () => hintTimeouts.current.forEach((id) => window.clearTimeout(id));
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

  function nameStartRect(element) {
    const cardRect = cardRef.current?.getBoundingClientRect();
    if (!cardRect) return null;
    const bounds = unionBounds(element.rects);
    const centerX = cardRect.left + ((bounds.x0 + bounds.x1) / 2) * cardRect.width;
    const top = cardRect.top + bounds.y0 * cardRect.height;
    const width = Math.min(200, Math.max(100, element.name.length * 9 + 32));
    return {
      left: centerX - width / 2,
      top: top - NAME_BADGE_HEIGHT - NAME_BADGE_GAP,
      width,
      height: NAME_BADGE_HEIGHT,
    };
  }

  function handleAccepted(element) {
    const highlightId = highlightCounter.current++;
    setHighlights((prev) => [...prev, { id: highlightId, rects: element.rects }]);
    setCollected((prev) => [
      ...prev,
      {
        key: element.listKey,
        text: element.name,
        slotIndex: prev.length,
        startRect: nameStartRect(element),
      },
    ]);
    setRevealed((prev) => [...prev, ...element.rects]);

    const next = remaining.filter((e) => e.listKey !== element.listKey);
    setRemaining(next);
    if (next.length === 0) setStage("ready");
  }

  function useHint() {
    hintTimeouts.current.forEach((id) => window.clearTimeout(id));
    // Captured once, here — not recomputed from `remaining` when the fade
    // starts, since a correct drop mid-hint would otherwise change which
    // rects the fade-out shows partway through.
    const rects = remaining.flatMap((el) => el.rects);
    setHint({ rects, fading: false });
    hintTimeouts.current = [
      window.setTimeout(() => setHint((h) => (h ? { ...h, fading: true } : h)), HINT_HOLD_MS),
      window.setTimeout(() => setHint(null), HINT_HOLD_MS + HINT_FADE_MS),
    ];
  }

  const hintable = stage === "playing" && phase !== "demo" && remaining.length > 0;
  const demoElement = remaining[0];

  function chipRef(listKey) {
    return (el) => {
      if (demoElement?.listKey === listKey) demoChipRef.current = el;
    };
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
        <button className="hint" type="button" onClick={useHint} disabled={!hintable || !!hint}>
          HINT
        </button>
      </div>

      <div className="drag-layout">
        {/* A leading spacer, mirroring the trailing one below - every
            round player was missing this (docs/decisions/0066, "center
            the content vertically... fix for all nodes"): a single
            trailing spacer only pushes the *rest* of the layout down
            from a fixed top, it doesn't center the whole block. */}
        <div className="drag-layout-spacer" aria-hidden="true" />
        <div className="reference-card is-compact drag-reference-card">
          <p className="reference-name">{cardName}</p>
          <div ref={cardRef} className="reference-art drag-target">
            <img src={masterForKey(cardKey)} alt={cardName} className="card-art-grey" />
            {revealed.map((rect, i) => (
              <div key={i} className="zone-reveal" style={rectBoxStyle(rect)}>
                <img src={masterForKey(cardKey)} alt="" style={rectImageStyle(rect)} />
              </div>
            ))}
            {hint
              ? hint.rects.map((rect, i) => (
                  <div
                    key={i}
                    className={hint.fading ? "zone-hint is-fading" : "zone-hint"}
                    style={rectBoxStyle(rect)}
                  />
                ))
              : null}
          </div>
        </div>

        {highlights.map((h) => (
          <ZoneHighlight key={h.id} rects={h.rects} cardRef={cardRef} />
        ))}

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

        <div className="chips drag-chips zone-chips">
          {remaining.map((element) => (
            <ZoneChip
              key={element.listKey}
              ref={chipRef(element.listKey)}
              element={element}
              cardRef={cardRef}
              disabled={stage !== "playing"}
              onAccepted={handleAccepted}
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

      {phase === "demo" && demoElement ? (
        <TutorialGhost
          chipRef={demoChipRef}
          cardRef={cardRef}
          targetRect={unionBounds(demoElement.rects)}
          text={demoElement.text}
          onDone={() => setPhase("live")}
        />
      ) : null}
    </main>
  );
}
