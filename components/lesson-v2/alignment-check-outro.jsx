"use client";

import Link from "next/link";
import { masterForKey } from "@/lib/rounds";
import { ALIGNMENT_STARS, AlignmentSparkle } from "./alignment-check-shared";

// The bookend to alignment-check-intro.jsx's own opening ceremony
// (Simon's brief: "a similar resolution step at the end where it declares
// you are ready to proceed") - one per major, echoing that card's own
// language back as a declaration of readiness rather than a question.
const OUTRO_LINES = {
  major_00_fool: "The leap's done. Onward - still no plan, and that's fine.",
  major_01_magician: "Resources gathered, sleight of hand ready. Onward.",
  major_02_high_priestess: "The veil lifts. Onward - quietly, knowingly.",
  major_03_empress: "Nourished and growing. Onward, fertile ground.",
  major_04_emperor: "Order established, no hesitation. Onward.",
  major_05_hierophant: "Lesson received. The bridge holds - cross it.",
  major_06_lovers: "Both paths weighed. Choose onward.",
  major_07_chariot: "Aligned and in gear. Full speed ahead.",
  major_08_strength: "Calm, not conquered. Onward, gently.",
  major_09_hermit: "Lantern lit. One careful step forward.",
  major_10_wheel_of_fortune: "Still turning. Hold your center and go.",
  major_11_justice: "Balance restored. Proceed, fairly.",
  major_12_hanged_man: "Right side up again. Onward, gently.",
  major_13_death: "Old growth cleared. Onward to what's next.",
  major_14_temperance: "Balanced and blended. Onward, patiently.",
  major_15_devil: "Chains loosened. Onward, freely.",
  major_16_tower: "Dust settled. Onward, clearer-eyed.",
  major_17_star: "Light returning. Onward, quietly hopeful.",
  major_18_moon: "Shadows acknowledged. Onward, eyes open.",
  major_19_sun: "Warmth confirmed. Onward, unguarded.",
  major_20_judgment: "Calling answered. Onward, reborn.",
  major_21_world: "Cycle complete. Onward to the next one.",
};

function outroLineFor(cardKey) {
  return OUTRO_LINES[cardKey] ?? "You're aligned. Onward to what's next.";
}

// Replaces NodeSession's default NodeCompleteCelebration for an Alignment
// Check node specifically (passed in as its own renderComplete), rather
// than stacking a second celebration after the first - the three stars
// are already sitting in the settled line here, holding the pose the
// intro ended on, instead of a fresh shooting star.
export default function AlignmentCheckOutro({ cardKey, cardName, nextHref, nextLabel }) {
  return (
    <main className="alignment-ceremony is-revealed is-outro">
      <div className="alignment-ceremony-stage">
        <div className="alignment-ceremony-card-wrap">
          <div className="alignment-ceremony-art-frame is-fading-in is-aligned-glimmer">
            <img src={masterForKey(cardKey)} alt={cardName} className="alignment-ceremony-art" />
          </div>
          {ALIGNMENT_STARS.map((s) => (
            <AlignmentSparkle
              key={s.id}
              className="alignment-orbit-star is-settled"
              style={{
                "--final-x": `${s.finalX}px`,
                "--final-y": `${s.finalY}px`,
                "--final-scale": s.scale,
                "--final-opacity": s.opacity,
              }}
            />
          ))}
        </div>
        <h1 className="alignment-ceremony-title">Aligned.</h1>
        <p className="alignment-ceremony-line">{outroLineFor(cardKey)}</p>
        <Link className="action alignment-ceremony-action" href={nextHref}>
          {nextLabel}
        </Link>
      </div>
    </main>
  );
}
