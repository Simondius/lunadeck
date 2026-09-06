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
// `captionPosition` (optional, "high" or unset) overrides where a plain
// image-background beat's caption sits. The base .journey-caption position
// (~70% down) was measured against Fool's own mocks, whose scenes put their
// subject up top and leave the LOWER portion of the frame empty (a stone
// wall, open ground). Magician's road-scene beats are the opposite - empty
// sky at the top, the farmer/cart/horses lower down - and its own mocks put
// the caption up in that sky, around a quarter of the way down (Simon,
// 0906 follow-up: "in the pngs the text is higher in the sky... in the code
// it is lower and less readable"). One hardcoded percentage can't serve
// both compositions, so this is per-beat rather than a single global
// number - set `captionPosition: "high"` on any beat whose own background
// has its empty space at the top instead of the bottom.
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
  // own solid ink fill shows through underneath it.
  //
  // Simon's later 0906 follow-up corrected this first pass on two counts:
  // (1) fading the WHOLE stage meant the background re-faded even between
  // two consecutive beats that share the exact same `bg` (every road-scene
  // dialogue beat in magician.js, for instance) - a visible flash-to-black
  // for art that was never actually changing. (2) 0.1s read as an abrupt
  // cut rather than the smooth dissolve he wanted; asked for 0.3s each way.
  // So this is now two independent phases instead of one: `scenePhase`
  // fades ONLY `.journey-bg` (see its own .is-transitioning rule in
  // globals.css), and only gets engaged when the upcoming beat's `bg`
  // actually differs from the current one - otherwise the image just sits
  // there, untouched, while the beat changes underneath it. `textPhase`
  // fades `.journey-caption` and runs on every beat change, since the text
  // (or choice options) is what's actually changing then. The card layer
  // needs no fade of its own - `cardArt` never changes value within a unit,
  // so React never remounts/reloads that <img> across beats regardless.
  //
  // Both still share one timer/duration (300ms): `textPhase` doubles as the
  // debounce (it always toggles, so a repeat tap mid-transition is a no-op
  // the same way the single `phase` used to be).
  const [scenePhase, setScenePhase] = useState("in");
  const [textPhase, setTextPhase] = useState("in");
  const transitionTimer = useRef(null);
  const TRANSITION_MS = 300;

  useEffect(() => {
    return () => {
      if (transitionTimer.current) clearTimeout(transitionTimer.current);
    };
  }, []);

  function changeBeat(newIndex) {
    if (textPhase === "out") return;
    const nextBg = unit.beats[newIndex]?.bg;
    const sceneChanges = nextBg !== beat.bg;
    dismissHint();
    if (prefersReducedMotion()) {
      setIndex(newIndex);
      return;
    }
    setTextPhase("out");
    if (sceneChanges) setScenePhase("out");
    transitionTimer.current = setTimeout(() => {
      setIndex(newIndex);
      setTextPhase("in");
      if (sceneChanges) setScenePhase("in");
    }, TRANSITION_MS);
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
        changeBeat(Math.min(index + 1, unit.beats.length - 1));
      },
      onPrev() {
        changeBeat(Math.max(index - 1, 0));
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unit.beats.length, index]);

  function advance() {
    if (isLast) {
      // Leaving the player entirely (on to the deck), not moving to another
      // beat within it - no fade, same as before.
      dismissHint();
      onComplete();
      return;
    }
    changeBeat(index + 1);
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
      className="journey-stage"
      onClick={isPassive ? advance : undefined}
      role={isPassive ? "button" : undefined}
      tabIndex={isPassive ? 0 : undefined}
    >
      <div
        className={`${bgIsImage ? "journey-bg" : `journey-bg is-${beat.bg}`}${
          scenePhase === "out" ? " is-transitioning" : ""
        }`}
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
        }${beat.captionPosition === "high" ? " is-high" : ""}${
          textPhase === "out" ? " is-transitioning" : ""
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
