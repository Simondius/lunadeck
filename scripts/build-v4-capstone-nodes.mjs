// Builds data/v4/capstone_nodes.json: one mid-unit "mini capstone" node
// per card (docs/decisions/0062) - a small, single-card mashup (plain +
// cloze + choice, three formats) testing only what that card's own unit
// has taught, reusing the exact per-round cardKey/cardName override 0059
// added to NodeSession (though here every round shares the same card, so
// it's set uniformly rather than varying per round). Shared between the
// two units that teach the same card (e.g. unit 1 and 2 both teach the
// Fool) - there's nothing character-specific about it, so one node per
// card is enough. Run with: node scripts/build-v4-capstone-nodes.mjs
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

function plain(card, correct, distractors) {
  return {
    id: id("cap"),
    ...CARD[card],
    words: [
      ...correct.map((text) => ({ text, correct: true })),
      ...distractors.map((text) => ({ text, correct: false })),
    ],
  };
}

function cloze(card, text, blanks, distractors) {
  return { id: id("cap"), type: "cloze", ...CARD[card], text, blanks, distractors };
}

function choice(card, prompt, correct, wrongOptions) {
  return { id: id("cap"), type: "choice", ...CARD[card], prompt, correct, options: [correct, ...wrongOptions] };
}

const NODES = {
  fool: {
    id: "capstone-fool",
    label: "Mini Capstone",
    rounds: [
      plain("fool", ["speed", "play"], ["creation", "partnership"]),
      cloze(
        "fool",
        "Nonconformist, revolutionary energy — willing to go against {b1}.",
        [{ key: "b1", answer: "convention" }],
        ["partnership", "beauty", "possibility"]
      ),
      choice(
        "fool",
        "Which of these is true of this card?",
        "Trusts that the path appears once you take the step",
        ["A reminder to love and care for yourself first", "Two paths, both valid — the challenge is choosing, not lacking options"]
      ),
      cloze(
        "fool",
        "On the edge of the precipice, but calm rather than afraid of the {b1}.",
        [{ key: "b1", answer: "void" }],
        ["choice", "harmony", "creation"]
      ),
      plain("fool", ["exploration", "intuition"], ["choosing with the heart", "beauty"]),
      choice(
        "fool",
        "Which of these is true of this card?",
        "Says yes to the unknown instead of playing it safe",
        [
          "Holding the masculine and feminine, or two sides of yourself, in balance",
          "Pleasure, beauty, and the body are not indulgences — they're part of the message",
        ]
      ),
    ],
  },
  lovers: {
    id: "capstone-lovers",
    label: "Mini Capstone",
    rounds: [
      plain("lovers", ["choice", "possibility"], ["levity", "nourishment"]),
      cloze(
        "lovers",
        "A partnership or union that asks you to listen to more than one voice — body, {b1}, and spirit.",
        [{ key: "b1", answer: "mind" }],
        ["cycle", "creation", "speed"]
      ),
      choice(
        "lovers",
        "Which of these is true of this card?",
        "Choosing with the heart, not just the head",
        ["Something is ready to be born, a project finally taking shape", "Says yes to the unknown instead of playing it safe"]
      ),
      cloze(
        "lovers",
        "Two paths, both valid — the challenge is {b1}, not lacking options.",
        [{ key: "b1", answer: "choosing" }],
        ["nourishing", "exploring", "protecting"]
      ),
      plain("lovers", ["partnership", "variety"], ["speed", "beauty"]),
      choice(
        "lovers",
        "Which of these is true of this card?",
        "Holding the masculine and feminine, or two sides of yourself, in balance",
        [
          "Nonconformist, revolutionary energy — willing to go against convention",
          "Abundance that comes from allowing things to flourish, not forcing them",
        ]
      ),
    ],
  },
  empress: {
    id: "capstone-empress",
    label: "Mini Capstone",
    rounds: [
      plain("empress", ["love", "beauty"], ["intuition", "partnership"]),
      cloze(
        "empress",
        "Mother Earth energy — fertility, {b1}, life growing in every direction.",
        [{ key: "b1", answer: "abundance" }],
        ["choice", "exploration", "leadership"]
      ),
      choice(
        "empress",
        "Which of these is true of this card?",
        "Creation before form — raw, generative chaos that hasn't settled yet",
        ["A real choice stands in front of you, asking to be weighed", "Nonconformist, revolutionary energy — willing to go against convention"]
      ),
      cloze(
        "empress",
        "Something is ready to be {b1} — a child, a project, an idea taking shape.",
        [{ key: "b1", answer: "born" }],
        ["chosen", "explored", "weighed"]
      ),
      plain("empress", ["creation", "harmony"], ["speed", "choice"]),
      choice(
        "empress",
        "Which of these is true of this card?",
        "Nourish, protect, and grow whatever you're tending",
        [
          "Travels light, takes chances with levity",
          "A partnership or union that asks you to listen to more than one voice",
        ]
      ),
    ],
  },
};

fs.writeFileSync("data/v4/capstone_nodes.json", JSON.stringify(NODES, null, 2) + "\n");
console.log(
  "wrote data/v4/capstone_nodes.json —",
  Object.entries(NODES).map(([card, n]) => `${card}: ${n.rounds.length} rounds`)
);
