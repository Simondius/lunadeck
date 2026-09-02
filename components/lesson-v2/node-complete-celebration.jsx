"use client";

import { useState } from "react";

// Twenty of them, on purpose (docs/decisions/0066: "20 delightful slightly
// unhinged affirmations that it cycles through") — one is picked at random
// per mount, not sequentially, so two nodes in a row rarely repeat.
const AFFIRMATIONS = [
  "You are a chaotic good main character and the universe knows it.",
  "Somewhere, a raccoon is proud of you right now.",
  "Your aura today: feral but polished.",
  "You contain multitudes, several of which are extremely correct.",
  "The moon saw that and thought “wow, valid.”",
  "You're not overthinking, you're just thorough at high speed.",
  "Chaos respects you. That's the highest honor.",
  "You radiate main-character-who-reads-the-terms-and-conditions energy.",
  "Somewhere a crow is taking notes on your vibe.",
  "You are doing suspiciously great, and that's allowed.",
  "The cards fear your rizz.",
  "You've unlocked feral clarity today.",
  "Even your typos are thriving.",
  "You are a walking plot twist, and everyone's invested.",
  "Your energy just made a houseplant grow an inch.",
  "You're built like a Tuesday that refuses to be boring.",
  "Somewhere, a goose is honking in solidarity.",
  "You have main-villain confidence with hero intentions.",
  "The stars aligned, took one look at you, and left it there.",
  "You're not lucky. You're just annoyingly correct today.",
];

// Fixed, not random, positions for the glitter dust the shooting star
// leaves behind - a believable trail follows one path, scattered random
// coordinates would just look like noise.
const GLITTER_DOTS = [
  { top: "18%", left: "78%", delay: 60 },
  { top: "28%", left: "68%", delay: 140 },
  { top: "22%", left: "58%", delay: 220 },
  { top: "38%", left: "50%", delay: 300 },
  { top: "30%", left: "40%", delay: 380 },
  { top: "45%", left: "32%", delay: 460 },
  { top: "40%", left: "22%", delay: 540 },
  { top: "52%", left: "14%", delay: 620 },
];

// The node-complete screen's own celebration (docs/decisions/0066,
// replacing the old "Node N complete / Placeholder ending" text) - a
// shooting star streaks across leaving a glitter trail, then one of
// twenty affirmations fades in where it lands. Picked once per mount via
// useState's lazy initializer, not on every render.
export default function NodeCompleteCelebration() {
  const [affirmation] = useState(() => AFFIRMATIONS[Math.floor(Math.random() * AFFIRMATIONS.length)]);

  return (
    <div className="node-complete-celebration">
      <div className="node-complete-star" aria-hidden="true" />
      {GLITTER_DOTS.map((dot, i) => (
        <span
          key={i}
          className="node-complete-glitter"
          style={{ top: dot.top, left: dot.left, animationDelay: `${dot.delay}ms` }}
          aria-hidden="true"
        />
      ))}
      <p className="node-complete-affirmation">{affirmation}</p>
    </div>
  );
}
