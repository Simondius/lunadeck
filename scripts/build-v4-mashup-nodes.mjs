// Builds data/v4/mashup_nodes.json: four "hard mashup" lesson nodes for
// v4's two review units (docs/decisions/0059) - two per unit, each mixing
// round formats (plain/cloze/choice) and covering all three of a review
// unit's cards in one node, rather than one card at a time like every
// other v4 lesson node. Every round names its own cardKey/cardName
// (NodeSession, per 0058's follow-up, falls back to the section's own
// cardKey/cardName when a round doesn't set one) so its reference art is
// always the card that round is actually testing, and every distractor -
// in the plain rounds' wrong words, the cloze blanks' wrong fillers, and
// the choice rounds' wrong options - is a real, true line from one of
// the *other* two cards, not a nonsense word, so the round is only easy
// once you actually know which of the three cards you're looking at.
import fs from "node:fs";

const CARD = {
  fool: { cardKey: "major_00_fool", cardName: "The Fool" },
  lovers: { cardKey: "major_06_lovers", cardName: "The Lovers" },
  empress: { cardKey: "major_03_empress", cardName: "The Empress" },
};

let uid = 0;
function id(prefix) {
  uid += 1;
  return `${prefix}-r${uid}`;
}

function plain(card, correct, distractorCards) {
  return {
    id: id("mash"),
    ...CARD[card],
    words: [
      ...correct.map((text) => ({ text, correct: true })),
      ...distractorCards.map((text) => ({ text, correct: false })),
    ],
  };
}

function cloze(card, text, blanks, distractors) {
  return { id: id("mash"), type: "cloze", ...CARD[card], text, blanks, distractors };
}

function choice(card, prompt, correct, wrongOptions) {
  return {
    id: id("mash"),
    type: "choice",
    ...CARD[card],
    prompt,
    correct,
    options: shuffle([correct, ...wrongOptions]),
  };
}

function shuffle(arr) {
  // Deterministic, not Math.random() - a build script's output should be
  // stable across runs so the diff is just the content, not a reshuffle.
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = (i * 2654435761) % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// Node A, shared shape for both units: Fool -> Lovers -> Empress ->
// Fool -> Lovers -> Empress, alternating plain/cloze/choice so no two
// consecutive rounds share a card or a format.
function mashupA() {
  return {
    id: "mashup-a",
    rounds: [
      plain("fool", ["nonconformity", "exploration"], ["partnership", "harmony"]),
      cloze(
        "lovers",
        "A real choice stands in front of you — has every {b1} actually been weighed?",
        [{ key: "b1", answer: "angle" }],
        ["nourishment", "intuition", "cycle"]
      ),
      choice(
        "empress",
        "Which of these is true of this card?",
        "Nourish, protect, and grow whatever you're tending",
        ["One cycle ends the instant the next begins", "A real choice stands in front of you, asking to be weighed"]
      ),
      cloze(
        "fool",
        "He steps to the edge of a {b1}, unafraid, trusting a {b2} will appear beneath his {b3}.",
        [
          { key: "b1", answer: "precipice" },
          { key: "b2", answer: "path" },
          { key: "b3", answer: "feet" },
        ],
        ["harmony", "partnership", "nourishment"]
      ),
      plain("lovers", ["choice", "partnership"], ["levity", "beauty"]),
      cloze(
        "empress",
        "{b1}, protect, and grow whatever you're tending.",
        [{ key: "b1", answer: "Nourish" }],
        ["Choose", "Explore", "Weigh"]
      ),
    ],
  };
}

// Node B, different specific content from A - Empress -> Fool -> Lovers
// -> Empress -> Fool -> Lovers, still alternating format.
function mashupB() {
  return {
    id: "mashup-b",
    rounds: [
      plain("empress", ["nourishment", "beauty"], ["spontaneity", "possibility"]),
      cloze(
        "fool",
        "Approaches life with a beginner's {b1} — curious, unguarded, unjaded.",
        [{ key: "b1", answer: "mind" }],
        ["choice", "harmony", "creation"]
      ),
      choice(
        "lovers",
        "Which of these is true of this card?",
        "Two paths, both valid — the challenge is choosing, not lacking options",
        [
          "Something is ready to be born, a project finally taking shape",
          "Nonconformist, revolutionary energy — willing to go against convention",
        ]
      ),
      cloze(
        "empress",
        "Abundance that comes from allowing things to {b1}, not forcing them.",
        [{ key: "b1", answer: "flourish" }],
        ["explore", "choose", "leap"]
      ),
      plain("fool", ["levity", "spontaneity"], ["choosing with the heart", "in a relationship"]),
      choice(
        "lovers",
        "Which of these is true of this card?",
        "A partnership that asks you to listen to more than one voice — body, mind, and spirit",
        [
          "Says yes to the unknown instead of playing it safe",
          "Pleasure, beauty, and the body are part of the message, not indulgences",
        ]
      ),
    ],
  };
}

// Node C/D: unit 8's own pair, genuinely different rounds from A/B (not
// just re-ids) - the two review units are back-to-back on the same path,
// so identical mashup content would just be the same six rounds twice.
function mashupC() {
  return {
    id: "mashup-c",
    rounds: [
      plain("lovers", ["variety", "possibility"], ["creation", "exploration"]),
      cloze(
        "empress",
        "Something is ready to be {b1} — a project or idea taking shape.",
        [{ key: "b1", answer: "born" }],
        ["chosen", "explored", "weighed"]
      ),
      choice(
        "fool",
        "Which of these is true of this card?",
        "Says yes to the unknown instead of playing it safe",
        ["A reminder to love and care for yourself first", "Choosing with the heart, not just the head"]
      ),
      cloze(
        "lovers",
        "Holding the masculine and feminine, or two sides of {b1}, in balance.",
        [{ key: "b1", answer: "yourself" }],
        ["the deck", "the moment", "the path"]
      ),
      plain("empress", ["love", "in a relationship"], ["speed", "choice"]),
      cloze(
        "fool",
        "Trusts that the {b1} appears once you take the {b2}.",
        [
          { key: "b1", answer: "path" },
          { key: "b2", answer: "step" },
        ],
        ["choice", "harmony", "creation"]
      ),
    ],
  };
}

function mashupD() {
  return {
    id: "mashup-d",
    rounds: [
      plain("fool", ["speed", "play"], ["nourishment", "choice"]),
      choice(
        "empress",
        "Which of these is true of this card?",
        "A reminder to love and care for yourself first",
        [
          "Two paths, both valid — the challenge is choosing, not lacking options",
          "Trusts that the path appears once you take the step",
        ]
      ),
      cloze(
        "lovers",
        "Choosing with the {b1}, not just the {b2}.",
        [
          { key: "b1", answer: "heart" },
          { key: "b2", answer: "head" },
        ],
        ["cycle", "mind", "feet"]
      ),
      plain("fool", ["intuition", "exploration"], ["partnership", "beauty"]),
      cloze(
        "empress",
        "Pleasure, beauty, and the {b1} are not indulgences — they're part of the message.",
        [{ key: "b1", answer: "body" }],
        ["choice", "journey", "cycle"]
      ),
      choice(
        "lovers",
        "Which of these is true of this card?",
        "Holding the masculine and feminine, or two sides of yourself, in balance",
        ["Something is ready to be born, a project finally taking shape", "One cycle ends the instant the next begins"]
      ),
    ],
  };
}

const out = {
  unit7: [{ ...mashupA(), label: "The Whole Deck, Mixed Up" }, { ...mashupB(), label: "Cross-Card Curveballs" }],
  unit8: [{ ...mashupC(), label: "The Whole Deck, Mixed Up" }, { ...mashupD(), label: "Cross-Card Curveballs" }],
};

fs.writeFileSync("data/v4/mashup_nodes.json", JSON.stringify(out, null, 2) + "\n");
console.log(
  "wrote data/v4/mashup_nodes.json —",
  Object.entries(out).map(([u, nodes]) => `${u}: ${nodes.length} nodes, ${nodes.reduce((a, n) => a + n.rounds.length, 0)} rounds`)
);
