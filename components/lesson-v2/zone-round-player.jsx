"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import ZoneChip from "./zone-chip";
import ZoneChipFlight, { FLIGHT_MS } from "./zone-chip-flight";
import ZoneHighlight from "./zone-highlight";
import TutorialTap from "./tutorial-tap";
import { masterForKey, seededShuffle } from "@/lib/rounds";
import { consumeTutorialSlot } from "@/lib/tutorial-gate";

// How long the Continue button takes to fade in once every phrase is placed.
const CONTINUE_FADE_MS = 500;
// Hint: how long the remaining zones stay lit before fading.
const HINT_HOLD_MS = 2000;
const HINT_FADE_MS = 400;
// Simon's spec: a wrong cross-tap flashes both sides red for half a second,
// then both are free to try again.
const WRONG_FLASH_MS = 500;
// FLIGHT_MS (imported from zone-chip-flight.jsx, the single source of
// truth for it) is how long a correct match's button takes to fly into
// its zone - the burst-and-colourize below is timed off that same number,
// so it lands the instant the button would, rather than sitting still for
// a beat first.

function keyed(round) {
  return seededShuffle(round.elements, round.id).map((el, i) => ({
    ...el,
    listKey: `${round.id}-${i}`,
  }));
}

// Where an element's rects sit as a whole, for the tutorial's own target -
// the union of every rect, not just the first, since night_sky is two.
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
// card it describes. Tap-then-tap, not drag (Simon's call: dragging a whole
// sentence onto a specific patch of card art read as unnatural) - tap a
// description, tap the part of the card it belongs to, in either order.
// Reports {missed} on completion, same contract as RoundPlayer, so
// NodeSession's mistake-review queue works identically for both round
// shapes — see node-session.jsx and docs/decisions/0038.
//
// The interaction model (Simon's own spec):
//   - Nothing selected, tap a description or a defined tap zone: it becomes
//     the current selection, highlighted with a gold/silver shimmer that
//     holds until it's matched or deselected.
//   - Tap a second thing of the *same* kind (another description, or
//     another zone): focus shifts to it. Tap the *same* selection again, or
//     an undefined patch of the card: it deselects.
//   - Tap a thing of the *other* kind while something's selected: that's a
//     match attempt. Correct (they describe the same element) - the button
//     flies into its zone and the zone bursts into glitter, colourizing
//     permanently and becoming untappable. Wrong - both flash red for
//     WRONG_FLASH_MS, then both are free to try again.
//
// The card starts desaturated — a plain grayscale <img> — and a correct
// match opens a permanent colour "window" over that element's own zone (see
// rectBoxStyle/rectImageStyle), synced with the burst so the colour arrives
// as the glitter lands rather than popping in instantly underneath it.
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
  // The one current selection, of either kind, or null - see the block
  // comment above for the full state machine this drives.
  const [selection, setSelection] = useState(null); // { type: "button" | "zone", key } | null
  // A wrong cross-tap's transient flash, cleared after WRONG_FLASH_MS -
  // separate from `selection`, which already goes back to null the instant
  // the mismatch is detected (both sides free up together, not one first).
  const [wrong, setWrong] = useState(null); // { buttonKey, zoneKey } | null
  const [flights, setFlights] = useState([]); // in-flight correct-match ghosts
  const [highlights, setHighlights] = useState([]); // arrived-match glitter bursts
  const [revealed, setRevealed] = useState([]); // rects[], flattened, permanent
  const [hint, setHint] = useState(null); // { rects, fading } | null
  const [stage, setStage] = useState("playing"); // playing | ready
  // Same rule as RoundPlayer: the tutorial only plays when the round is
  // marked for it, never on a second-look replay, and (lib/tutorial-gate.js)
  // only for the first three times this mechanic shows up anywhere in the
  // path - starts "live" always, flipped to "demo" by the layout effect
  // below if this mount earns a slot.
  const [phase, setPhase] = useState("live");
  const cardRef = useRef(null);
  const demoChipRef = useRef(null);
  const continueRef = useRef(null);
  const missedRef = useRef(false);
  const highlightCounter = useRef(0);
  const flightCounter = useRef(0);
  const hintTimeouts = useRef([]);
  const wrongTimeout = useRef(null);
  const flightTimeouts = useRef(new Set());
  // listKey -> the chip's own DOM node, so a correct match can measure
  // exactly where the button was sitting before it unmounts (see
  // confirmMatch below) - a synthetic/estimated rect would drift from the
  // real button's actual size and position.
  const chipNodes = useRef(new Map());
  // Guards consumeTutorialSlot - a Strict Mode dev double-invoke of the
  // layout effect below would otherwise burn two slots (a real
  // localStorage increment, not a harmless re-run) for one actual mount.
  const tutorialSlotConsumed = useRef(false);

  useEffect(() => {
    return () => {
      hintTimeouts.current.forEach((id) => window.clearTimeout(id));
      window.clearTimeout(wrongTimeout.current);
      flightTimeouts.current.forEach((id) => window.clearTimeout(id));
    };
  }, []);

  useLayoutEffect(() => {
    if (tutorialSlotConsumed.current) return;
    tutorialSlotConsumed.current = true;
    if (round.tutorial && !secondLook && consumeTutorialSlot("zone")) {
      setPhase("demo");
    }
    // Mount-only: round.tutorial/secondLook are stable for the lifetime
    // of a single round instance.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useLayoutEffect(() => {
    if (stage === "ready" && continueRef.current) {
      continueRef.current.animate([{ opacity: 0 }, { opacity: 1 }], {
        duration: CONTINUE_FADE_MS,
        fill: "forwards",
      });
    }
  }, [stage]);

  function confirmMatch(key) {
    setSelection(null);
    const element = remaining.find((e) => e.listKey === key);
    if (!element) return;

    const buttonEl = chipNodes.current.get(key);
    const startRect = buttonEl?.getBoundingClientRect() ?? null;
    const flightId = flightCounter.current++;
    setFlights((prev) => [
      ...prev,
      { id: flightId, text: element.name, startRect, rects: element.rects },
    ]);

    const timeoutId = window.setTimeout(() => {
      flightTimeouts.current.delete(timeoutId);
      setFlights((prev) => prev.filter((flight) => flight.id !== flightId));
      const highlightId = highlightCounter.current++;
      setHighlights((prev) => [...prev, { id: highlightId, rects: element.rects }]);
      setRevealed((prev) => [...prev, ...element.rects]);
    }, FLIGHT_MS);
    flightTimeouts.current.add(timeoutId);

    const next = remaining.filter((e) => e.listKey !== key);
    setRemaining(next);
    if (next.length === 0) setStage("ready");
  }

  // Whichever side was *already* selected before this wrong cross-tap
  // stays selected - Simon's call: only the side just tried and rejected
  // resets, so a miss doesn't cost the learner their original pick and
  // force them to reselect it before trying again.
  function triggerWrong(zoneKey, buttonKey, keep) {
    missedRef.current = true;
    window.clearTimeout(wrongTimeout.current);
    setSelection(keep);
    setWrong({ zoneKey, buttonKey });
    wrongTimeout.current = window.setTimeout(() => setWrong(null), WRONG_FLASH_MS);
  }

  // Reads `selection` straight from render-time state rather than a
  // setSelection functional updater - confirmMatch/triggerWrong each fire
  // several setState calls of their own, which a React Strict Mode dev
  // build would invoke twice over if they lived inside an updater
  // function (React intentionally double-runs those to catch exactly this
  // kind of impurity). A plain tap handler closing over the latest
  // render's state has no such rule.
  function tapButton(key) {
    if (stage !== "playing") return;
    if (selection?.type === "button") {
      setSelection(selection.key === key ? null : { type: "button", key });
      return;
    }
    if (selection?.type === "zone") {
      if (selection.key === key) confirmMatch(key);
      else triggerWrong(selection.key, key, selection);
      return;
    }
    setSelection({ type: "button", key });
  }

  function tapZone(key) {
    if (stage !== "playing") return;
    if (selection?.type === "zone") {
      setSelection(selection.key === key ? null : { type: "zone", key });
      return;
    }
    if (selection?.type === "button") {
      if (selection.key === key) confirmMatch(key);
      else triggerWrong(key, selection.key, selection);
      return;
    }
    setSelection({ type: "zone", key });
  }

  function tapEmptyArea() {
    setSelection(null);
  }

  function useHint() {
    hintTimeouts.current.forEach((id) => window.clearTimeout(id));
    // Captured once, here — not recomputed from `remaining` when the fade
    // starts, since a correct match mid-hint would otherwise change which
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
      if (el) chipNodes.current.set(listKey, el);
      else chipNodes.current.delete(listKey);
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
          <div ref={cardRef} className="reference-art drag-target" onClick={tapEmptyArea}>
            <img src={masterForKey(cardKey)} alt={cardName} className="card-art-grey" />
            {revealed.map((rect, i) => (
              <div key={i} className="zone-reveal" style={rectBoxStyle(rect)}>
                <img src={masterForKey(cardKey)} alt="" style={rectImageStyle(rect)} />
              </div>
            ))}
            {remaining.flatMap((element) =>
              element.rects.map((rect, i) => {
                const isSelected = selection?.type === "zone" && selection.key === element.listKey;
                const isWrong = wrong?.zoneKey === element.listKey;
                return (
                  <button
                    key={`${element.listKey}-${i}`}
                    type="button"
                    className={
                      "zone-tap-area" +
                      (isSelected ? " is-selected" : "") +
                      (isWrong ? " is-wrong" : "")
                    }
                    style={rectBoxStyle(rect)}
                    aria-label={element.name}
                    onClick={(e) => {
                      e.stopPropagation();
                      tapZone(element.listKey);
                    }}
                  />
                );
              })
            )}
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

        {flights.map((f) => (
          <ZoneChipFlight
            key={f.id}
            text={f.text}
            startRect={f.startRect}
            rects={f.rects}
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
              status={
                selection?.type === "button" && selection.key === element.listKey
                  ? "selected"
                  : wrong?.buttonKey === element.listKey
                    ? "wrong"
                    : "idle"
              }
              disabled={stage !== "playing"}
              onTap={() => tapButton(element.listKey)}
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
        <TutorialTap
          chipRef={demoChipRef}
          cardRef={cardRef}
          targetRect={unionBounds(demoElement.rects)}
          onDone={() => setPhase("live")}
        />
      ) : null}
    </main>
  );
}
