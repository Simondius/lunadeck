"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { masterForKey } from "@/lib/rounds";
import { registerNodeSkip } from "@/lib/dev-console-bridge";
import { markJourneyStarted } from "@/lib/journey-progress";
import { useTapHint } from "./use-tap-hint";
import JourneyText from "./journey-text";
import JourneyCard from "./journey-card";
import JourneyChoiceGroup from "./journey-choice-group";

function prefersReducedMotion() {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

// Plays one Journey unit (data/journey/units/*.js) beat by beat.
//
// Beat shapes:
//   { kind: "line", bg, text?, textStyle?, cardArt?/cardKey? } - passive,
//                                                        tap anywhere to
//                                                        advance; text is
//                                                        optional (a couple
//                                                        of beats are a
//                                                        silent reaction
//                                                        shot - tap to
//                                                        continue still
//                                                        applies)
//   { kind: "choice", bg, text?, cardArt?/cardKey?, options } -
//                                                        JourneyChoiceGroup
//                                                        advances on resolve
//   { kind: "unlock", bg, text }                      - final beat, its own
//                                                        button calls
//                                                        onComplete instead
//                                                        of advancing
//
// `bg` is either one of the CSS-only keyword backgrounds (currently just
// "void", app/globals.css's .is-void) or a real image path (any string
// starting with "/") - each unit's own mock-derived art, extracted per
// docs/decisions/0100-journey-mode-scaffold.md. `cardArt` is a direct image path
// for the card shown mid-beat (preferred - it's the unit's own extracted
// card art); `cardKey` falls back to the shared deck's master art via
// lib/rounds.js for units that don't have their own card crop yet.
//
// Every passive beat shows a "tap to continue" hint after 1s of no action
// (useTapHint) - the choice beats don't, since the required action there is
// tapping a specific option, not tapping anywhere.
export default function JourneyPlayer({ unit, onComplete }) {
  const [index, setIndex] = useState(0);
  const beat = unit.beats[index];
  const isLast = index === unit.beats.length - 1;
  const isPassive = beat.kind === "line";
  const [hintVisible, dismissHint] = useTapHint(index);

  // Simon (0906 follow-up): "there is a black screen for a fraction of a
  // second in between transitions... whenever we transition we do a 0.1s
  // fade out and 0.1s fade in so it looks intentional." The flash was the
  // next beat's background image not being decoded yet the instant `bg`
  // swaps - .journey-bg has nothing to paint for a beat, so .journey-stage's
  // own solid ink fill shows through underneath it. Two changes fix this
  // together: this phase state drives a brief opacity fade on the whole
  // stage around every beat change (see .journey-stage.is-transitioning in
  // globals.css) so any remaining latency reads as a deliberate dip to
  // black rather than a glitch, and the effect below preloads every beat's
  // image up front so there normally isn't any latency left to hide.
  // `phase === "out"` also doubles as a debounce - changeBeat no-ops on a
  // repeat tap mid-fade instead of racing two beat changes.
  const [phase, setPhase] = useState("in");
  const transitionTimer = useRef(null);

  useEffect(() => {
    return () => {
      if (transitionTimer.current) clearTimeout(transitionTimer.current);
    };
  }, []);

  function changeBeat(updateIndex) {
    if (phase === "out") return;
    dismissHint();
    if (prefersReducedMotion()) {
      updateIndex();
      return;
    }
    setPhase("out");
    transitionTimer.current = setTimeout(() => {
      updateIndex();
      setPhase("in");
    }, 100);
  }

  // Every beat's background image, fetched as soon as the player mounts
  // rather than only when the reader actually reaches that beat - these are
  // small, already-optimized crops (docs/decisions/0100), so warming the
  // browser cache for all of them up front is cheap and means the fade
  // above almost never has real network latency left to mask.
  useEffect(() => {
    const urls = unit.beats
      .map((b) => b.bg)
      .filter((bg) => typeof bg === "string" && bg.startsWith("/"));
    for (const src of new Set(urls)) {
      const img = new Image();
      img.src = src;
    }
  }, [unit]);

  // Simon (0906): the very first time ever, the JOURNEY tab should skip
  // straight to this full-bleed player rather than the home/preview
  // screen (journey-home-screen.jsx) - every visit after that first one
  // lands on the preview screen instead, X included. Marking it here,
  // on mount, rather than only from the home screen's own redirect
  // decision, covers every way a reader can reach the player (a
  // bookmark, the dev console's "Open" link, not just the home screen)
  // - otherwise one of those other entry paths could leave `hasStarted`
  // false, and exiting via the X would loop straight back into the
  // player instead of actually showing the preview screen.
  useEffect(() => {
    markJourneyStarted();
  }, []);

  // Dev-console forward/back (lib/dev-console-bridge.js): the same < >
  // controls chapter-player.jsx and node-session.jsx already register for
  // Story/v4 - Journey never plugged into this bridge, which is why those
  // arrows silently didn't show up here even though the dev console itself
  // is mounted on every route (0906 report). Skip just moves `index`
  // directly - it doesn't call onComplete on the last beat, since it's a
  // preview/scrub control for testers, not another way to finish the unit.
  useEffect(() => {
    return registerNodeSkip({
      onNext() {
        changeBeat(() => setIndex((i) => Math.min(i + 1, unit.beats.length - 1)));
      },
      onPrev() {
        changeBeat(() => setIndex((i) => Math.max(i - 1, 0)));
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unit.beats.length]);

  function advance() {
    if (isLast) {
      // Leaving the player entirely (on to the deck), not moving to another
      // beat within it - no fade, same as before.
      dismissHint();
      onComplete();
      return;
    }
    changeBeat(() => setIndex((current) => current + 1));
  }

  const cardSrc = beat.cardArt || (beat.cardKey ? masterForKey(beat.cardKey) : null);
  const bgIsImage = beat.bg?.startsWith("/");
  // A beat with no card and no real background image (only "*Thud*" today)
  // is the mocks' one dead-centered screen - everything else anchors its
  // caption at .journey-caption's default ~70%-down position instead. See
  // that class's own comment in app/globals.css.
  const isCentered = !bgIsImage && beat.bg === "void" && !cardSrc;

  return (
    <div
      className={`journey-stage${phase === "out" ? " is-transitioning" : ""}`}
      onClick={isPassive ? advance : undefined}
      role={isPassive ? "button" : undefined}
      tabIndex={isPassive ? 0 : undefined}
    >
      <div
        className={bgIsImage ? "journey-bg" : `journey-bg is-${beat.bg}`}
        style={bgIsImage ? { backgroundImage: `url(${beat.bg})` } : undefined}
        aria-hidden="true"
      />

      {/* Simon's 0906 follow-up: the only way INTO the full-bleed player is
          now the home screen's "Continue Journey" button
          (journey-home-screen.jsx), so this is the way back out of it -
          always back to that home screen, never straight to the app's
          other tabs. stopPropagation keeps this from also firing the
          stage's own tap-to-advance handler on passive beats. */}
      <Link
        href="/journey"
        className="journey-exit"
        aria-label="Exit to Journey"
        onClick={(event) => event.stopPropagation()}
      >
        ×
      </Link>

      {cardSrc && beat.revealCard ? (
        // The reveal-glow beat plays its own glow background first (like
        // any other image beat), then this whole group - keyed by `index`
        // so it remounts (and its CSS animations restart) every time the
        // reader actually lands on this beat, including via the dev
        // console's skip arrows - runs a timed flash -> dim -> card-in
        // sequence. `display:contents` on .journey-reveal (see its own
        // rule) keeps it from adding an extra box to .journey-stage's
        // flex layout; the flash/veil are `position:fixed` so they cover
        // the whole screen regardless of where this group would
        // otherwise sit in flow.
        <div className="journey-reveal" key={`reveal-${index}`}>
          <span className="journey-reveal-flash" aria-hidden="true" />
          <span className="journey-reveal-veil" aria-hidden="true" />
          <div className="journey-reveal-card-in">
            <JourneyCard src={cardSrc} alt={unit.cardName} initial={unit.cardName?.[0]} />
          </div>
        </div>
      ) : cardSrc ? (
        // compact: the mocks use a visibly SMALLER card specifically on
        // choice beats (measured from the source screens: ~66% viewport
        // width / card bottom ~52% down, vs. ~88% width / ~71% down on a
        // plain reveal). The full-size card's own bottom edge lands past
        // .journey-caption's 70% start, which is exactly what put the
        // choice buttons - and, same reasoning, the unlock beat's own
        // "Continue to your deck" button - on top of the card art in the
        // shipped version (Simon's 0102 report). Any beat with a button
        // below the caption text (choice or unlock) needs the smaller
        // size to leave real, non-overlapping room for it; a plain reveal
        // has nothing but caption text below, so the bigger card is
        // correct there.
        <JourneyCard
          src={cardSrc}
          alt={unit.cardName}
          initial={unit.cardName?.[0]}
          compact={beat.kind === "choice" || beat.kind === "unlock"}
        />
      ) : null}

      <div
        className={`journey-caption${isCentered ? " is-centered" : ""}${
          cardSrc ? " is-below-card" : ""
        }`}
      >
        {beat.text ? <JourneyText variant={beat.textStyle}>{beat.text}</JourneyText> : null}

        {beat.kind === "choice" ? (
          // key={index}: without it, React reuses the same JourneyChoiceGroup
          // instance across choice beats (same slot in the tree), so its
          // internal `statuses`/`locked` state from the PREVIOUS choice beat
          // leaks into the next one - `locked` in particular is never reset
          // to false after a correct answer, so every choice beat after the
          // first was permanently unresponsive to taps. Keying by beat index
          // forces a fresh mount (fresh state) each time the beat changes.
          <JourneyChoiceGroup key={index} options={beat.options} onResolved={advance} />
        ) : null}

        {beat.kind === "unlock" ? (
          <button
            type="button"
            className="journey-choice"
            onClick={(event) => {
              event.stopPropagation();
              onComplete();
            }}
          >
            Continue to your deck
          </button>
        ) : null}

        {isPassive ? (
          <span className={`journey-tap-hint${hintVisible ? " is-visible" : ""}`}>
            tap to continue
          </span>
        ) : null}
      </div>
    </div>
  );
}
