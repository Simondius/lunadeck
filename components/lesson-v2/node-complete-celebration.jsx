"use client";

import { useState } from "react";

// One pool per card, twenty each, each one actually about that card's own
// reading notes (data/data_card_talking_points.csv) rather than generic
// hype text - Simon's call: "contextually relevant to the card being
// tested and unique." Fool's leap/precipice/beginner's-mind, Lovers' two-
// valid-paths/heart-over-head/balance, Empress' abundance/nourish/self-love
// - the same notes the lesson content itself teaches, just played for a
// laugh instead of a fact. GENERIC below is the fallback for anything
// without its own pool yet (a mashup node's own top-level cardKey is just
// whichever card its first round happens to use, not necessarily what the
// whole node covered).
const CARD_AFFIRMATIONS = {
  major_00_fool: [
    "You just leapt off a cliff and the void said “yeah, fair enough.”",
    "Zero luggage, zero plan, maximum main-character energy.",
    "The precipice took one look at your calm and got nervous instead.",
    "You said yes to the unknown and the unknown is now slightly intimidated.",
    "Beginner's mind, expert chaos.",
    "You travel so light even your baggage doesn't recognize you.",
    "Somewhere, a cliff edge is bragging about who almost jumped off it.",
    "You didn't need the path to appear - you just kept walking until it did.",
    "Convention took one look at you and quietly rescheduled.",
    "You're not lost. You're aggressively exploratory.",
    "The universe drew up a five-year plan and you just stepped over it.",
    "A fresh cycle started the second you stopped overthinking the last one.",
    "You have the confidence of someone who has never once read the warning label.",
    "Somewhere, a small white dog is proud to be associated with you.",
    "You looked at the edge of the map and said “neat, more room.”",
    "Your vibe today: delightfully, structurally unbothered.",
    "You are the human embodiment of “it'll be fine, probably.”",
    "The void looked back and blinked first.",
    "You're not reckless. You're just early to the plan everyone else hasn't thought of yet.",
    "Somewhere, a bindle is packed and proud.",
  ],
  major_06_lovers: [
    "Both paths were valid and you picked the one with better lighting. Iconic.",
    "You weighed it with your heart, your head, and possibly a coin toss, and still landed correctly.",
    "Two options stood before you. You said “why not both” and somehow made that work.",
    "Body, mind, and spirit just held a group vote and unanimously chose you.",
    "You didn't overthink the choice. You just under-thought it beautifully.",
    "Balance isn't a skill, it's just what happens when you refuse to pick a side and thrive anyway.",
    "Somewhere, a coin is still spinning because it can't compete with your instincts.",
    "You chose with your heart and your heart has excellent taste, frankly.",
    "Two roads diverged and you just stood in the middle looking fabulous.",
    "Your inner voices held a meeting and for once they all agreed.",
    "You held two truths at once and didn't even wobble.",
    "The choice wasn't between right and wrong. It was between good and also good, and you nailed it.",
    "Somewhere, a soulmate is quietly impressed by your decision-making.",
    "You listened to your gut, your heart, and your group chat, in that order, and thrived.",
    "You're the reason “it's complicated” can also mean “it's going great.”",
    "Union achieved. Balance achieved. Snack also achieved, probably.",
    "You picked a side without picking a side, and somehow both sides won.",
    "Your masculine and feminine energy just high-fived.",
    "You chose the harder, more honest option and made it look effortless.",
    "Somewhere, two doors are arguing about which one you liked better.",
  ],
  major_03_empress: [
    "Something in you is ready to be born and it already has better taste than you.",
    "You are growing in every direction like a mother earth who skipped leg day guilt entirely.",
    "You didn't force it. You let it bloom, and it bloomed smugly.",
    "Somewhere, a houseplant just achieved sentience out of sheer respect.",
    "Abundance saw you coming and rolled out a whole extra buffet.",
    "You nourished it, protected it, and grew it, and it owes you nothing but flowers.",
    "You loved yourself first today and the universe was frankly relieved.",
    "Raw generative chaos, but make it aesthetic.",
    "You're not overindulging. You're honoring the body as a sacred message, obviously.",
    "Something is taking shape inside you and it already has a business plan.",
    "You let it grow instead of forcing it, and it grew twice as fast out of gratitude.",
    "Fertility, abundance, and a suspicious amount of snacks - a balanced day.",
    "You radiate “life growing in every direction” and mild dessert energy.",
    "The garden looked at your vibe and unionized in your favor.",
    "You are the reason “ripe with possibility” is a compliment now.",
    "Somewhere, a seed just skipped several growth stages out of pure admiration.",
    "You tended to something today and it will absolutely remember you fondly.",
    "Pleasure and beauty are not indulgent. You knew that already, clearly.",
    "You didn't chase abundance today. Abundance just showed up, sat down, and stayed.",
    "Something beautiful is forming and it already has your sense of humor.",
  ],
};

// The original twenty (docs/decisions/0066) - not about any particular
// card, kept as the fallback for a cardKey with no pool of its own yet.
const GENERIC_AFFIRMATIONS = [
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
// shooting star streaks across leaving a glitter trail, then one of that
// card's own twenty affirmations fades in where it lands. Picked once per
// mount via useState's lazy initializer, not on every render.
export default function NodeCompleteCelebration({ cardKey }) {
  const [affirmation] = useState(() => {
    const pool = CARD_AFFIRMATIONS[cardKey] ?? GENERIC_AFFIRMATIONS;
    return pool[Math.floor(Math.random() * pool.length)];
  });

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
