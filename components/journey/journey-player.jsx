"use client";

import { useState } from "react";
import { masterForKey } from "@/lib/rounds";
import { useTapHint } from "./use-tap-hint";
import JourneyText from "./journey-text";
import JourneyCard from "./journey-card";
import JourneyChoiceGroup from "./journey-choice-group";

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

  function advance() {
    dismissHint();
    if (isLast) {
      onComplete();
      return;
    }
    setIndex((current) => current + 1);
  }

  const cardSrc = beat.cardArt || (beat.cardKey ? masterForKey(beat.cardKey) : null);
  const bgIsImage = beat.bg?.startsWith("/");

  return (
    <div
      className="journey-stage"
      onClick={isPassive ? advance : undefined}
      role={isPassive ? "button" : undefined}
      tabIndex={isPassive ? 0 : undefined}
    >
      <div
        className={bgIsImage ? "journey-bg" : `journey-bg is-${beat.bg}`}
        style={bgIsImage ? { backgroundImage: `url(${beat.bg})` } : undefined}
        aria-hidden="true"
      />
      <div className="journey-content">
        {cardSrc ? (
          <JourneyCard src={cardSrc} alt={unit.cardName} initial={unit.cardName?.[0]} />
        ) : null}

        {beat.text ? <JourneyText variant={beat.textStyle}>{beat.text}</JourneyText> : null}

        {beat.kind === "choice" ? (
          <JourneyChoiceGroup options={beat.options} onResolved={advance} />
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
