// Builds data/v4/<card>_section.json for the 17 Major Arcana cards that
// never got v2/v3-style round content (only Fool/Lovers/Empress/Magician/
// Emperor did) - built directly from the source CSVs rather than
// regrouped from an existing v3 file, since no such file exists for these
// cards. Same 7-node shape every other v4 section uses, sized to each
// card's own actual keyword/talking-point count rather than a fixed
// template - Simon's own call ("adapt as needed if the card has more or
// less content").
//
// Node 2 ("Find the Elements") is a deliberate placeholder - Simon has a
// separate process extracting each card's own visual elements (the zone
// rects and tile-match crops Fool/Lovers/Magician/Emperor already have
// hand-authored), so this only writes a structurally valid stand-in
// clearly marked as pending, not real content to be mistaken for
// finished work.
//
// Run with: node scripts/build-v4-new-cards.mjs
import fs from "node:fs";
import path from "node:path";
import { toObjects } from "../lib/csv.js";

const DATA_DIR = path.join(process.cwd(), "data");

function load(name) {
  return toObjects(fs.readFileSync(path.join(DATA_DIR, name), "utf8"));
}

const NEW_CARDS = [
  "major_02_high_priestess",
  "major_05_hierophant",
  "major_07_chariot",
  "major_08_strength",
  "major_09_hermit",
  "major_10_wheel_of_fortune",
  "major_11_justice",
  "major_12_hanged_man",
  "major_13_death",
  "major_14_temperance",
  "major_15_devil",
  "major_16_tower",
  "major_17_star",
  "major_18_moon",
  "major_19_sun",
  "major_20_judgment",
  "major_21_world",
];

// Every major already built for v4 (existing + this batch) - the pool
// swipe/choice/keyword distractors are allowed to borrow real content
// from, so a distractor is always a genuine reading about some other
// taught card, never invented.
const ALL_MAJORS = [
  "major_00_fool",
  "major_01_magician",
  "major_02_high_priestess",
  "major_03_empress",
  "major_04_emperor",
  "major_05_hierophant",
  "major_06_lovers",
  "major_07_chariot",
  "major_08_strength",
  "major_09_hermit",
  "major_10_wheel_of_fortune",
  "major_11_justice",
  "major_12_hanged_man",
  "major_13_death",
  "major_14_temperance",
  "major_15_devil",
  "major_16_tower",
  "major_17_star",
  "major_18_moon",
  "major_19_sun",
  "major_20_judgment",
  "major_21_world",
];

const SILLY_WORDS = [
  "Tuesday",
  "banana",
  "purple",
  "spaghetti",
  "trombone",
  "cactus",
  "violin",
  "Saturday",
];

const cardsBase = load("data_tarot_cards_base.csv");
const cardName = new Map(cardsBase.map((r) => [r.card_key, r.card_name]));

const keywordRows = load("data_card_keywords.csv");
const keywordsByCard = new Map();
for (const r of keywordRows) {
  const list = keywordsByCard.get(r.card_key) ?? [];
  list[Number(r.keyword_order) - 1] = r.keyword;
  keywordsByCard.set(r.card_key, list);
}

const talkingPointRows = load("data_card_talking_points.csv");
const talkingPointsByCard = new Map();
for (const r of talkingPointRows) {
  const list = talkingPointsByCard.get(r.card_key) ?? [];
  list[Number(r.note_order) - 1] = r.reading_note;
  talkingPointsByCard.set(r.card_key, list);
}

const descriptionRows = load("data_card_descriptions.csv");
const descriptionByCard = new Map(descriptionRows.map((r) => [r.card_key, r.description_condensed]));

// A few cards' own description_condensed opens by naming its Major Arcana
// neighbor with a bare ordinal ("After the stability of Four...") rather
// than the card's own name - fine in the guidebook's own flowing prose,
// but confusing lifted into a standalone recap cloze with nothing around
// it to say "Four" means "the 4th Major Arcana card" and not, say, a
// reading position (0080 hit the same shape of problem in Empress's own
// hand-authored round, which opened "Card three follows... the Two").
// Trimmed here at the source rather than patched per generated file.
const DESCRIPTION_OPENER_OVERRIDE = new Map([
  [
    "major_05_hierophant",
    "He bridges the everyday and the sacred, teaching that a spiritual perspective can carry us through hard moments. Pairing him with sensory, present-focused Taurus seems unlikely, until you notice Taurus fully inhabits the here and now. Aries was divine spark; Taurus is the true birth, holding that flame within earthly form.",
  ],
]);
for (const [cardKey, text] of DESCRIPTION_OPENER_OVERRIDE) {
  descriptionByCard.set(cardKey, text);
}

const similarityRows = load("data_card_similarity.csv");
// card_key -> [{other, score}], sorted highest-similarity first, majors only.
const similarityByCard = new Map();
for (const r of similarityRows) {
  const score = Number(r.similarity_score);
  if (ALL_MAJORS.includes(r.card_key_a) && ALL_MAJORS.includes(r.card_key_b)) {
    for (const [self, other] of [
      [r.card_key_a, r.card_key_b],
      [r.card_key_b, r.card_key_a],
    ]) {
      const list = similarityByCard.get(self) ?? [];
      list.push({ other, score });
      similarityByCard.set(self, list);
    }
  }
}
// Ascending, not descending - data_card_similarity.csv's own
// difficulty_tier confirms similarity_score is inverted from what the
// column name suggests: 1.0 = "Hard" (genuinely hard to tell the two
// cards apart), 3.0 = "Easy" (obviously distinct). The lowest score is
// the most confusable pairing, which is what a "closer distractor" round
// actually wants.
for (const list of similarityByCard.values()) list.sort((a, b) => a.score - b.score);

let uid = 0;
function id(card, prefix) {
  uid += 1;
  return `${card}-${prefix}${uid}`;
}

// A short, punchy phrase derived from a real reading note - light
// trimming only (drop a trailing clause after an em dash if the note
// carries one), never a reworded/invented meaning. Falls back to the
// note as-is when there's nothing to trim.
// Choice-round options read as complete sentences, not keywords (Simon's
// call, app/globals.css:1470) - so a note's own short "label — clause"
// shape (e.g. "Moderation — finding the right balance...") can't just take
// the label: on its own it renders as a single stray word next to three
// full-sentence options. Below a 3-word floor, fall back to the label
// plus its clause instead of the label alone.
function shortPhrase(note) {
  const dashSplit = note.split(" — ");
  const label = dashSplit[0];
  if (label.split(/\s+/).length >= 3 || dashSplit.length < 2) return label;
  return `${label} — ${dashSplit[1]}`;
}

// Pulls `count` genuinely-confusable keywords for `card` from its own
// most-similar other majors, skipping anything already used as a
// distractor elsewhere in this same unit (the `used` set) - never this
// card's own real keywords.
function closerKeywordDistractors(cardKey, ownKeywords, count, used) {
  const out = [];
  const ownSet = new Set(ownKeywords);
  for (const { other } of similarityByCard.get(cardKey) ?? []) {
    if (out.length >= count) break;
    for (const kw of keywordsByCard.get(other) ?? []) {
      if (out.length >= count) break;
      if (ownSet.has(kw) || used.has(kw) || out.includes(kw)) continue;
      out.push(kw);
      used.add(kw);
    }
  }
  return out;
}

const STOPWORDS = new Set(["that", "with", "this", "from", "into", "than", "their", "there"]);

// Turns one real word in `text` into a {b1}-style cloze blank. Tries each
// of `preferredWords` in order (a card's own real keywords/talking
// points) and blanks the first one that actually appears verbatim; a
// naive single-shot regex swap (this function replaces) can silently
// no-op when the "preferred" word never appears in the text at all,
// which produces a cloze round with a `blanks` entry nothing in the
// rendered sentence corresponds to - the longest-real-word fallback
// guarantees a blank always lands on an actual word in the actual text.
function blankRealWord(text, preferredWords, blankKey = "b1") {
  for (const word of preferredWords) {
    if (!word) continue;
    const re = new RegExp(`\\b${word}\\b`, "i");
    if (re.test(text)) {
      return { text: text.replace(re, `{${blankKey}}`), answer: word };
    }
  }
  // Strips ALL surrounding punctuation, not just trailing "." and "," -
  // a word like "signature:" (colon still attached) breaks the \b regex
  // below, since \b can't find a word boundary immediately after a
  // non-word character followed by whitespace, so the "blank" this
  // picks silently never lands in the text at all.
  const candidates = text
    .split(/\s+/)
    .map((w) => w.replace(/^[^A-Za-z0-9]+|[^A-Za-z0-9]+$/g, ""))
    .filter((w) => w.length > 5 && !STOPWORDS.has(w.toLowerCase()));
  const longestWord = candidates.sort((a, b) => b.length - a.length)[0] ?? "journey";
  const re = new RegExp(`\\b${longestWord}\\b`);
  return { text: text.replace(re, `{${blankKey}}`), answer: longestWord };
}

// Real reading notes from other majors, for swipe/choice "false" options -
// genuine tarot content, just not true of this card.
function otherCardNotes(cardKey, count, used) {
  const out = [];
  for (const { other } of similarityByCard.get(cardKey) ?? []) {
    if (out.length >= count) break;
    for (const note of talkingPointsByCard.get(other) ?? []) {
      if (out.length >= count) break;
      const phrase = shortPhrase(note);
      if (used.has(phrase) || out.includes(phrase)) continue;
      out.push(phrase);
      used.add(phrase);
    }
  }
  return out;
}

function buildSection(cardKey) {
  const name = cardName.get(cardKey);
  const keywords = (keywordsByCard.get(cardKey) ?? []).filter(Boolean);
  const notes = (talkingPointsByCard.get(cardKey) ?? []).filter(Boolean);
  const description = descriptionByCard.get(cardKey);
  const usedDistractorWords = new Set();
  const usedDistractorPhrases = new Set();

  const half = Math.max(1, Math.ceil(keywords.length / 2));
  const firstTier = keywords.slice(0, half);
  const secondTier = keywords.slice(half);

  // --- Node 1: Meet the Card - easy tier, silly (not confusable) wrongs.
  const node1 = {
    id: "node-1",
    rounds: [
      {
        id: id(cardKey, "n1-r"),
        tutorial: true,
        words: [
          ...firstTier.map((text) => ({ text, correct: true })),
          { text: SILLY_WORDS[0], correct: false },
          { text: SILLY_WORDS[1], correct: false },
        ],
      },
    ],
  };

  // --- Node 2: Find the Elements - placeholder, pending Simon's own
  // extraction pass. Two rects (top/bottom half) so the round is still
  // structurally playable, not a single degenerate "tap anywhere."
  const node2 = {
    id: "node-2",
    rounds: [
      {
        id: id(cardKey, "n2-r"),
        type: "zone",
        elements: [
          {
            key: "placeholder-top",
            text: "Element pending - real content lands once the extraction pass for this card is done.",
            rects: [{ x0: 0, y0: 0, x1: 1, y1: 0.5 }],
            name: "Placeholder (top)",
          },
          {
            key: "placeholder-bottom",
            text: "Element pending - real content lands once the extraction pass for this card is done.",
            rects: [{ x0: 0, y0: 0.5, x1: 1, y1: 1 }],
            name: "Placeholder (bottom)",
          },
        ],
      },
    ],
  };

  // --- Node 3: More New Words - the rest of the real keywords, still at
  // the easy/silly-distractor tier (a card with <=2 keywords repeats its
  // own first tier here rather than leaving this node empty).
  const tier2Words = secondTier.length > 0 ? secondTier : firstTier;
  const node3 = {
    id: "node-3",
    rounds: [
      {
        id: id(cardKey, "n3-r"),
        words: [
          ...tier2Words.map((text) => ({ text, correct: true })),
          { text: SILLY_WORDS[2], correct: false },
          { text: SILLY_WORDS[3], correct: false },
        ],
      },
    ],
  };

  // --- Mini Capstone: plain + cloze + choice, this card's own content only.
  const capstoneNote = notes[0] ?? description;
  const capstoneBlank = blankRealWord(capstoneNote, keywords);
  const capstone = {
    id: `${cardKey}-capstone`,
    label: "Mini Capstone",
    rounds: [
      {
        id: id(cardKey, "cap-r"),
        cardKey,
        cardName: name,
        words: [
          ...keywords.slice(0, Math.min(3, keywords.length)).map((text) => ({ text, correct: true })),
          { text: SILLY_WORDS[4], correct: false },
        ],
      },
      {
        id: id(cardKey, "cap-r"),
        type: "cloze",
        cardKey,
        cardName: name,
        text: capstoneBlank.text,
        blanks: [{ key: "b1", answer: capstoneBlank.answer }],
        distractors: [SILLY_WORDS[5], SILLY_WORDS[6]],
      },
      {
        id: id(cardKey, "cap-r"),
        type: "choice",
        cardKey,
        cardName: name,
        prompt: "Which of these is true of this card?",
        correct: shortPhrase(notes[1] ?? notes[0] ?? description),
        options: [
          shortPhrase(notes[1] ?? notes[0] ?? description),
          ...otherCardNotes(cardKey, 2, new Set()),
        ],
      },
    ],
  };

  // --- Node 4: Closer Distractors - all real keywords, genuinely
  // confusable wrongs pulled from the most similar other majors, at
  // least 6 words total (Simon's own rule for anything after node 3).
  const closerNeeded = Math.max(2, 6 - keywords.length);
  const closerDistractors = closerKeywordDistractors(cardKey, keywords, closerNeeded, usedDistractorWords);
  const node4 = {
    id: "node-4",
    rounds: [
      {
        id: id(cardKey, "n4-r"),
        words: [
          ...keywords.map((text) => ({ text, correct: true })),
          ...closerDistractors.map((text) => ({ text, correct: false })),
        ],
      },
    ],
  };

  // --- Node 5: All the Keywords - a swipe deck: this card's own reading
  // notes (true) against other majors' own real notes (false).
  const trueCards = notes.map((note) => ({ text: shortPhrase(note), isMatch: true }));
  const falseNotes = otherCardNotes(cardKey, Math.max(4, trueCards.length), usedDistractorPhrases);
  const node5 = {
    id: "node-5",
    rounds: [
      {
        id: id(cardKey, "n5-r"),
        type: "swipe",
        cards: [...trueCards, ...falseNotes.map((text) => ({ text, isMatch: false }))],
      },
    ],
  };

  // --- Node 6: Pick the True Reading - one choice round per reading
  // note, wrongs drawn from other majors' real notes (never repeating a
  // wrong option already used elsewhere in this unit).
  const node6Rounds = notes.map((note, i) => {
    const wrongs = otherCardNotes(cardKey, 3, usedDistractorPhrases);
    return {
      id: id(cardKey, "n6-r"),
      type: "choice",
      prompt: "Which of these is true of this card?",
      correct: shortPhrase(note),
      options: [shortPhrase(note), ...wrongs],
    };
  });
  const node6 = { id: "node-6", rounds: node6Rounds };

  // --- Node 7: The Full Picture - the whole condensed description as one
  // recap cloze, blanking up to two of its own real keywords (falling
  // back to the longest real word in the text when a keyword never
  // literally appears in it - see blankRealWord).
  const firstBlank = blankRealWord(description, keywords, "b1");
  const remainingKeywords = keywords.filter((k) => k !== firstBlank.answer);
  const secondBlank =
    remainingKeywords.length > 0 ? blankRealWord(firstBlank.text, remainingKeywords, "b2") : null;
  const recapText = secondBlank ? secondBlank.text : firstBlank.text;
  const recapBlanks = [
    { key: "b1", answer: firstBlank.answer },
    ...(secondBlank ? [{ key: "b2", answer: secondBlank.answer }] : []),
  ];
  const node7 = {
    id: "node-7",
    rounds: [
      {
        id: id(cardKey, "n7-r"),
        type: "cloze",
        text: recapText,
        blanks: recapBlanks,
        distractors: [SILLY_WORDS[0], SILLY_WORDS[1], SILLY_WORDS[2]],
      },
    ],
  };

  return {
    cardKey,
    cardName: name,
    nodes: [node1, node2, node3, node4, node5, node6, node7],
    capstone,
  };
}

const capstoneOut = {};
for (const cardKey of NEW_CARDS) {
  const section = buildSection(cardKey);
  const slug = cardKey.replace(/^major_\d+_/, "");
  const { capstone, ...sectionOut } = section;
  capstoneOut[slug] = capstone;
  const outPath = path.join(DATA_DIR, "v4", `${slug}_section.json`);
  fs.writeFileSync(outPath, JSON.stringify(sectionOut, null, 2) + "\n");
  console.log(
    `${slug}: ${sectionOut.nodes.reduce((n, node) => n + node.rounds.length, 0)} rounds across 7 nodes + capstone`
  );
}

// Merges into the existing capstone_nodes.json rather than overwriting it
// (fool/lovers/empress's own capstones live there too, hand-authored).
const capstonePath = path.join(DATA_DIR, "v4", "capstone_nodes.json");
const existingCapstones = JSON.parse(fs.readFileSync(capstonePath, "utf8"));
const mergedCapstones = { ...existingCapstones, ...capstoneOut };
fs.writeFileSync(capstonePath, JSON.stringify(mergedCapstones, null, 2) + "\n");
console.log(`capstone_nodes.json: added ${Object.keys(capstoneOut).length} new entries`);
