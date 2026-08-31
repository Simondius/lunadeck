import test from "node:test";
import assert from "node:assert/strict";

import {
  SPREAD,
  pullSpread,
  groundingFor,
  userPromptFor,
  stripEmDashes,
} from "./reading.js";

// A deterministic stand-in for the crypto source, so a spread is reproducible
// in a test without making the app itself rerollable.
function sequence(values) {
  let i = 0;
  return () => values[i++ % values.length];
}

const CARDS = [
  {
    key: "major_00_fool",
    name: "The Fool",
    keywords: ["exploration", "levity"],
    symbol: "Planet: Uranus",
    meaning: "The Fool stands at both the start and end of the journey.",
    reversed: "Recklessness without awareness.",
    talkingPoints: ["Beginning and ending in one"],
  },
  { key: "minor_cups_01", name: "Ace of Cups", keywords: ["feeling"], meaning: "A cup offered." },
  { key: "minor_swords_06", name: "Six of Swords", keywords: ["passage"], meaning: "A crossing." },
  { key: "major_16_tower", name: "The Tower", keywords: ["rupture"], meaning: "The structure falls." },
];

test("a spread is three distinct cards in the three positions", () => {
  const spread = pullSpread({ cards: CARDS, random: sequence([0.1, 0.9, 0.4, 0.2, 0.8, 0.3]) });
  assert.equal(spread.length, 3);
  assert.equal(new Set(spread.map((s) => s.card.key)).size, 3, "no card twice in one spread");
  assert.deepEqual(
    spread.map((s) => s.position.id),
    SPREAD.map((p) => p.id)
  );
});

test("a spread is not seeded — two pulls differ", () => {
  const a = pullSpread({ cards: CARDS, random: sequence([0.1, 0.1, 0.1]) });
  const b = pullSpread({ cards: CARDS, random: sequence([0.9, 0.9, 0.9]) });
  assert.notDeepEqual(
    a.map((s) => s.card.key),
    b.map((s) => s.card.key)
  );
});

test("too few cards yields no spread rather than a short one", () => {
  assert.deepEqual(pullSpread({ cards: CARDS.slice(0, 2) }), []);
  assert.deepEqual(pullSpread({}), []);
});

test("grounding carries the guidebook rows, and only those", () => {
  const spread = [
    { card: CARDS[0], reversed: true, position: SPREAD[0] },
    { card: CARDS[1], reversed: false, position: SPREAD[1] },
  ];
  const text = groundingFor(spread);

  assert.match(text, /The Fool, reversed/);
  assert.match(text, /Keywords: exploration, levity/);
  assert.match(text, /Planet: Uranus/);
  assert.match(text, /Reversed note: Recklessness without awareness\./);
  assert.match(text, /Reading note: Beginning and ending in one/);
  assert.match(text, /Where you are/);
  assert.match(text, /Ace of Cups, upright/);
  // The Ace has no reversed note and landed upright: nothing invented for it.
  const aceBlock = text.split("\n\n").find((block) => block.includes("Ace of Cups"));
  assert.doesNotMatch(aceBlock, /Reversed note:/);
});

test("a card with no reversed note still carries its upright material", () => {
  const text = groundingFor([{ card: CARDS[1], reversed: true, position: SPREAD[0] }]);
  assert.match(text, /Ace of Cups, reversed/);
  assert.match(text, /Upright meaning: A cup offered\./, "read the tension, don't hand it a blank");
});

test("the question reaches the prompt intact", () => {
  const spread = pullSpread({ cards: CARDS, random: sequence([0.1, 0.5, 0.2]) });
  const prompt = userPromptFor({ question: "Should I take the job?", spread });
  assert.match(prompt, /Should I take the job\?/);
  assert.match(prompt, /Where this goes if nothing changes|Where it leads/);
});

// The em dash is the one voice rule that can be enforced rather than asked
// for, so it is the one with a test. Everything else in VOICE is a prompt
// budget and undefended by design — see docs/decisions/0027.
test("em dashes are removed whatever shape they arrive in", () => {
  const cases = [
    ["fire behind it — quick thinking", "fire behind it, quick thinking"],
    ["a habit you trust – something steady", "a habit you trust, something steady"],
    ["spaced -- double hyphen", "spaced, double hyphen"],
    ["no dashes at all here", "no dashes at all here"],
  ];
  for (const [input, expected] of cases) {
    assert.equal(stripEmDashes(input), expected);
  }
});

test("stripping never leaves doubled or orphaned punctuation", () => {
  assert.equal(stripEmDashes("already punctuated —, like this."), "already punctuated, like this.");
  assert.equal(stripEmDashes("a clause —. Then a stop."), "a clause. Then a stop.");
  assert.equal(stripEmDashes("one — two — three"), "one, two, three");
});

test("stripping leaves paragraph breaks alone", () => {
  const text = "First line — with a dash\n\nSecond line — another";
  assert.equal(stripEmDashes(text), "First line, with a dash\n\nSecond line, another");
});

test("no em dash survives a reading-shaped block of prose", () => {
  const reading = `You start the day at a gallop — sword up, mind already there.
The King of Wands is the pressure on that — he's the same fire, seated.
Where it goes is the Hierophant — a teacher, a structure — something steady.`;
  assert.doesNotMatch(stripEmDashes(reading), /[—–]/);
});
