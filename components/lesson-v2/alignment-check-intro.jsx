"use client";

import { useEffect, useRef, useState } from "react";
import { masterForKey } from "@/lib/rounds";
import { ALIGNMENT_STARS, AlignmentSparkle } from "./alignment-check-shared";

// A funny, card-specific pun that also works as "you're about to be
// tested and graded" (Simon's brief) - one per major, grounded in that
// card's own reading notes (data_card_talking_points.csv) the way
// node-complete-celebration.jsx's own CARD_AFFIRMATIONS pools are, just
// one line instead of twenty since this fires once per node, not once
// per round.
const INTRO_LINES = {
  major_00_fool: "See how much of a Fool you really are.",
  major_01_magician: "Let's see if you actually have everything you need, or you're just winging it.",
  major_02_high_priestess: "Let's see how much you actually absorbed without anyone noticing.",
  major_03_empress: "See how much of an Empress you really are, abundance-wise.",
  major_04_emperor: "See how much of an Emperor you really are, or just bossy.",
  major_05_hierophant: "See how much of that tradition actually stuck.",
  major_06_lovers: "See if you can actually pick the right answer this time.",
  major_07_chariot: "Let's see if your two forces are actually pulling the same way.",
  major_08_strength: "See how much Strength you really have - the gentle kind.",
  major_09_hermit: "See how much of a Hermit you really are, solitude-wise, not just antisocial.",
  major_10_wheel_of_fortune: "Let's see what you actually caught while the Wheel was spinning.",
  major_11_justice: "Time for an honest, unflinching look at what you actually remember.",
  major_12_hanged_man: "See how much a new perspective actually taught you, upside down.",
  major_13_death: "See what actually survived the transformation.",
  major_14_temperance: "See if you actually found the right blend, or just guessed.",
  major_15_devil: "See how loose those chains actually are.",
  major_16_tower: "See what's left standing after the lightning strike.",
  major_17_star: "See how much of that hope actually stuck around.",
  major_18_moon: "See how much you actually remember from the dark.",
  major_19_sun: "See if that confidence is actually earned, or just sunburn.",
  major_20_judgment: "Time for your own honest reckoning.",
  major_21_world: "See if you actually closed the circle, or just walked in one.",
};

function introLineFor(cardKey, cardName) {
  return INTRO_LINES[cardKey] ?? `Let's see how well you actually know ${cardName}.`;
}

// Two extra "planets" - pure atmosphere, not part of the icon's own
// payoff, so they drift past and fade rather than landing on the line
// (keeping the three-star finish visually unambiguous).
const PLANETS = [
  { id: "p1", angle: -1, delay: 60, color: "var(--accent-bright)" },
  { id: "p2", angle: 1, delay: 320, color: "#e0b866" },
];

const REVEAL_MS = 2600;

// The opening screen for an "Alignment Check" node (0089's rebrand, 0093's
// own ceremony): the card shimmers, a scatter of stars and planets swirl
// around it and settle into the same three-star line the node's own path
// icon shows, then the title and a card-specific joke about being about to
// get quizzed fade in. Tapping anywhere skips straight to the settled
// state - same "don't trap an impatient user in a cutscene" rule
// chapter-player.jsx's own shimmer-skip and unit-complete-celebration.jsx's
// wait-skip both already follow.
export default function AlignmentCheckIntro({ cardKey, cardName, onContinue }) {
  const [revealed, setRevealed] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    timerRef.current = window.setTimeout(() => setRevealed(true), REVEAL_MS);
    return () => window.clearTimeout(timerRef.current);
  }, []);

  function skip() {
    window.clearTimeout(timerRef.current);
    setRevealed(true);
  }

  return (
    <main
      className={`alignment-ceremony${revealed ? " is-revealed" : ""}`}
      onClick={skip}
    >
      <div className="alignment-ceremony-stage">
        <div className="alignment-ceremony-card-wrap">
          <div className={`alignment-ceremony-art-frame${revealed ? " is-aligned-glimmer" : " is-entering"}`}>
            <img src={masterForKey(cardKey)} alt={cardName} className="alignment-ceremony-art" />
          </div>
          {PLANETS.map((p) => (
            <span
              key={p.id}
              aria-hidden="true"
              className={`alignment-orbit-planet${revealed ? " is-settled" : ""}`}
              style={{
                background: p.color,
                "--angle": p.angle,
                animationDelay: `${p.delay}ms`,
              }}
            />
          ))}
          {ALIGNMENT_STARS.map((s) => (
            <AlignmentSparkle
              key={s.id}
              className={`alignment-orbit-star${revealed ? " is-settled" : ""}`}
              style={{
                "--final-x": `${s.finalX}px`,
                "--final-y": `${s.finalY}px`,
                "--final-scale": s.scale,
                "--final-opacity": s.opacity,
                animationDelay: `${s.delay}ms`,
              }}
            />
          ))}
        </div>
        <h1 className="alignment-ceremony-title">Alignment Check</h1>
        <p className="alignment-ceremony-line">{introLineFor(cardKey, cardName)}</p>
        <button
          type="button"
          className="action alignment-ceremony-action"
          onClick={(e) => {
            e.stopPropagation();
            onContinue();
          }}
        >
          Begin
        </button>
      </div>
    </main>
  );
}
