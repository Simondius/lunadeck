// Builds data/v4/<card>_section.json for the 17 Major Arcana cards that
// never got v2/v3-style round content (only Fool/Lovers/Empress/Magician/
// Emperor did) - built directly from the source CSVs rather than
// regrouped from an existing v3 file, since no such file exists for these
// cards. Same 7-node shape every other v4 section uses, sized to each
// card's own actual keyword/talking-point count rather than a fixed
// template - Simon's own call ("adapt as needed if the card has more or
// less content").
//
// Node 2 ("Find the Elements") started as a placeholder pending Simon's
// own element-extraction pass; real data has since been wired directly
// into each of these 17 cards' own output files (not through this
// script). buildSection's own existingNode2() reads whatever is already
// in a card's output file and reuses it verbatim unless it's still the
// placeholder - rerunning this script for an unrelated fix elsewhere in
// the same card (a cloze-length or distractor change, say) must never
// silently wipe that real data back to the placeholder again (0088 - it
// happened twice before this got fixed).
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

// Every "silly" (obviously-wrong, not a real card keyword) single-word
// distractor in the app draws from this one pool now - node-1/node-3/the
// capstone's own plain round, node-7's recap cloze, and the capstone's own
// cloze all used to index a tiny fixed 8-word array directly, always the
// same "Tuesday"/"banana" for every one of the 17 cards this generates
// (0088: "Tuesday and Banana seem to appear repeatedly... no single word
// appears more than twice in a unit or 5 times in the entire course"). One
// pool, one allocator, both caps enforced together.
const SILLY_WORDS = [
  "Tuesday", "Wednesday", "Thursday", "Saturday", "Sunday", "Monday", "Friday",
  "banana", "spaghetti", "purple", "trombone", "cactus", "violin", "elephant",
  "teacup", "pizza", "umbrella", "bicycle", "broccoli", "ladder", "green",
  "orange", "yellow", "turquoise", "beige", "maroon",
  "kazoo", "accordion", "tambourine", "harmonica", "bagpipes", "xylophone",
  "pretzel", "sandwich", "meatball", "pancake", "waffle", "burrito", "dumpling",
  "raccoon", "platypus", "walrus", "penguin", "octopus", "hedgehog", "flamingo",
  "volcano", "glacier", "tornado", "avalanche", "puddle", "geyser",
  "compass", "anchor", "lantern", "whistle", "telescope", "magnet",
  "seashell", "pinecone", "jellyfish", "starfish", "barnacle", "coral",
  "marmalade", "mustard", "ketchup", "mayonnaise", "vinegar", "cinnamon",
  "puzzle", "yo-yo", "kite", "marble", "domino", "jigsaw",
  "toaster", "blender", "vacuum", "stapler", "clipboard", "thermostat",
  "sock", "mitten", "beanie", "scarf", "galoshes", "poncho",
  "hiccup", "yawn", "sneeze", "wink", "shrug", "doodle",
  "gargoyle", "unicycle", "trampoline", "seesaw", "pogo stick", "wheelbarrow",
  "cauliflower", "artichoke", "eggplant", "turnip", "radish", "parsnip",
  "typewriter", "postcard", "envelope", "paperclip", "rubber band", "thumbtack",
  "snorkel", "flipper", "goggles", "life raft", "paddle", "buoy",
  "bagel", "croissant", "muffin", "biscuit", "scone", "cupcake",
];
const SILLY_WORD_GLOBAL_CAP = 5;
const SILLY_WORD_PER_CARD_CAP = 2;
const sillyWordGlobalUsage = new Map();
const sillyWordPerCardUsage = new Map();
let sillyWordCursor = 0;

// Round-robins SILLY_WORDS, skipping anything already at 5 uses across the
// whole run or 2 uses for this specific card (module-level state, so the
// caps hold across all 17 cards, not just within one).
function drawSillyWords(cardKey, count) {
  const perCard = sillyWordPerCardUsage.get(cardKey) ?? new Map();
  sillyWordPerCardUsage.set(cardKey, perCard);
  const out = [];
  let guard = 0;
  while (out.length < count && guard < SILLY_WORDS.length * 4) {
    const word = SILLY_WORDS[sillyWordCursor % SILLY_WORDS.length];
    sillyWordCursor += 1;
    guard += 1;
    const globalUsed = sillyWordGlobalUsage.get(word) ?? 0;
    const cardUsed = perCard.get(word) ?? 0;
    if (globalUsed < SILLY_WORD_GLOBAL_CAP && cardUsed < SILLY_WORD_PER_CARD_CAP && !out.includes(word)) {
      sillyWordGlobalUsage.set(word, globalUsed + 1);
      perCard.set(word, cardUsed + 1);
      out.push(word);
    }
  }
  return out;
}

// Choice-round "obviously wrong" options for a card's first (only) teaching
// unit (0087) - otherCardNotes() always pulled a choice round's wrong
// options from the MOST similar other majors, so every "Pick the True
// Reading" round was maximum-confusability with no easier option at all,
// appropriate for a review unit testing mastery but not for a first
// encounter. Full sentences, per 0080's own "choice options read as
// sentences, not labels" rule - and genuinely invented nonsense rather
// than sourced content, since the entire point is that nothing about them
// should read as plausibly true of any real card.
const SILLY_SENTENCES = [
  "The card is legally required to agree with your horoscope",
  "Only works if you're holding it upside down and humming",
  "Secretly a coupon for one free tarot reading",
  "Was originally a recipe card before the printer got confused",
  "Grants one wish, but only on a leap year",
  "Means you should immediately reorganize your sock drawer",
  "Is actually just the Nine of Cups wearing a costume",
  "Requires a permit from the local moon council",
  "Only true if read aloud in a haunted house",
  "Was drawn upside down by a cat walking across the deck",
  "Comes with a money-back guarantee if you dislike your future",
  "Its meaning changes depending on what you had for breakfast",
  "Doubles as a coaster in a pinch",
  "Is void where prohibited",
  "Only counts if you drew it with your eyes closed",
  "Was printed by mistake and means nothing at all",
  "Requires three witnesses and a notarized signature to interpret",
  "Its real meaning is written in invisible ink on the back",
  "Only applies to left-handed Tuesdays",
  "Is a trick question with no correct interpretation",
  "Means you owe the deck a favor",
  "Has to be read backwards while standing on one foot",
  "Was actually meant for the person sitting behind you",
  "Comes with batteries not included",
  "Only works if the room is exactly 72 degrees",
  "Is a rerun of a card you already drew last week",
  "Grants temporary immunity from bad decisions",
  "Its meaning resets every time someone sneezes nearby",
  "Was shuffled in from a completely different deck by accident",
  "Requires a subscription to unlock the second half of its meaning",
];
const sillySentenceUsage = new Map();
let sillySentenceCursor = 0;

function drawSillySentences(count) {
  const out = [];
  let guard = 0;
  while (out.length < count && guard < SILLY_SENTENCES.length * 4) {
    const sentence = SILLY_SENTENCES[sillySentenceCursor % SILLY_SENTENCES.length];
    sillySentenceCursor += 1;
    guard += 1;
    const used = sillySentenceUsage.get(sentence) ?? 0;
    if (used < 6 && !out.includes(sentence)) {
      sillySentenceUsage.set(sentence, used + 1);
      out.push(sentence);
    }
  }
  return out;
}

// Simon's own calibration: a paragraph under 10 words only needs one or two
// blanks, and one around 30 words should carry three to five - a fixed
// count regardless of length either tests too little of a long paragraph
// or crowds a short one. Floor is 2, not 1 (0094: every cloze round needs
// at least two blanks, full stop, even a single short sentence).
function targetBlankCount(wordCount) {
  return Math.max(2, Math.min(5, Math.round(wordCount / 8)));
}

// Blanks up to `targetBlankCount(words in text)` distinct real keywords
// (falling back to blankRealWord's own longest-real-word rule once
// keywords run out - which a short sentence with only one or two real
// keywords hits immediately for its second/third blank, same as the first
// blank always could), then trims to just the sentence(s) that ended up
// holding a blank - same reasoning as 0085, generalized past a fixed
// one-or-two-blank assumption. If the trimmed result still runs past
// `wordLimit` (multiple blanks landing in their own separate long
// sentences), drops blanks from the end, restoring each one's real word,
// until it fits - but never below 2 (0094), even if that means the
// trimmed text runs a little past wordLimit; the blank-count floor wins.
function buildScaledCloze(text, keywords, wordLimit) {
  const wordCount = text.trim().split(/\s+/).length;
  const target = Math.max(2, Math.min(targetBlankCount(wordCount), 5));

  let working = text;
  const blanks = [];
  const used = new Set();
  for (let i = 0; i < target; i++) {
    const key = `b${i + 1}`;
    const remaining = keywords.filter((k) => !used.has(k));
    const result = blankRealWord(working, remaining, key);
    if (used.has(result.answer)) break;
    used.add(result.answer);
    working = result.text;
    blanks.push({ key, answer: result.answer });
  }

  while (blanks.length > 2) {
    const trimmed = trimToBlankSentences(working);
    if (trimmed.split(/\s+/).length <= wordLimit) return { text: trimmed, blanks };
    const last = blanks.pop();
    working = working.replace(`{${last.key}}`, last.answer);
  }
  return { text: trimToBlankSentences(working), blanks };
}

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

// Calibrated against a real device screenshot at node-7's own font size -
// High Priestess's own trimmed recap (33 words, two sentences) fit with
// room to spare; Sun's (54 words, two long sentences) pushed its word
// bank off the bottom of the screen even after the same trim.
const RECAP_WORD_LIMIT = 42;

// Keeps only the sentence(s) in `text` that actually contain a {bN} blank
// placeholder, in their original order - a recap round only needs to show
// what it's actually quizzing, not the whole paragraph the blank(s) were
// pulled from. Falls back to the full text if every blank somehow landed
// in the same single-sentence description (nothing to trim).
function trimToBlankSentences(text) {
  const sentences = (text.match(/[^.!?]+[.!?]*/g) ?? [text]).map((s) => s.trim());
  const withBlanks = sentences.filter((s) => /\{b\d+\}/.test(s));
  if (!withBlanks.length || withBlanks.length === sentences.length) return text.trim();
  return withBlanks.join(" ").trim();
}

// Real reading notes from other majors, for swipe/choice "false" options -
// genuine tarot content, just not true of this card.
//
// otherCardNotes always walked similarityByCard from the top (most
// confusable first), so the handful of majors that happen to rank as
// "most similar" to many other cards dominated as donors - Fool alone
// backed 35 of the course's ~200 real-phrase distractor slots, while
// several majors barely appeared (0091). drawSillyWords already solved
// the same shape of problem for silly words (0088); this is that same
// cap-and-skip pattern applied to donor cards instead of donor words.
const DONOR_GLOBAL_CAP = 10; // across all 17 cards this script builds
const DONOR_PER_CARD_CAP = 2; // within one consuming card's own slots
const donorGlobalUsage = new Map();
const donorPerCardUsage = new Map();
function otherCardNotes(cardKey, count, used) {
  const perCard = donorPerCardUsage.get(cardKey) ?? new Map();
  donorPerCardUsage.set(cardKey, perCard);
  const out = [];
  for (const { other } of similarityByCard.get(cardKey) ?? []) {
    if (out.length >= count) break;
    const globalUsed = donorGlobalUsage.get(other) ?? 0;
    const cardUsed = perCard.get(other) ?? 0;
    if (globalUsed >= DONOR_GLOBAL_CAP || cardUsed >= DONOR_PER_CARD_CAP) continue;
    let pulled = 0;
    for (const note of talkingPointsByCard.get(other) ?? []) {
      if (out.length >= count) break;
      const phrase = shortPhrase(note);
      if (used.has(phrase) || out.includes(phrase)) continue;
      out.push(phrase);
      used.add(phrase);
      pulled += 1;
    }
    if (pulled > 0) {
      donorGlobalUsage.set(other, globalUsed + pulled);
      perCard.set(other, cardUsed + pulled);
    }
  }
  return out;
}

const PLACEHOLDER_ELEMENT_MARKER = "Element pending";

// Reads node-2 from this card's own EXISTING output file, if any, and
// reuses it verbatim as long as it isn't still the placeholder - see the
// header comment above (0088).
function existingNode2(slug) {
  const outPath = path.join(DATA_DIR, "v4", `${slug}_section.json`);
  if (!fs.existsSync(outPath)) return null;
  const existing = JSON.parse(fs.readFileSync(outPath, "utf8"));
  const node2 = existing.nodes?.find((n) => n.id === "node-2");
  if (!node2) return null;
  const stillPlaceholder = JSON.stringify(node2).includes(PLACEHOLDER_ELEMENT_MARKER);
  return stillPlaceholder ? null : node2;
}

function buildSection(cardKey) {
  const slug = cardKey.replace(/^major_\d+_/, "");
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
          ...drawSillyWords(cardKey, 2).map((text) => ({ text, correct: false })),
        ],
      },
    ],
  };

  // --- Node 2: Find the Elements - real data if this card's own output
  // file already has it (existingNode2 above), otherwise a structural
  // placeholder pending Simon's own extraction pass. Two rects (top/bottom
  // half) so the placeholder round is still playable, not a single
  // degenerate "tap anywhere."
  const node2 = existingNode2(slug) ?? {
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
          ...drawSillyWords(cardKey, 2).map((text) => ({ text, correct: false })),
        ],
      },
    ],
  };

  // --- Mini Capstone: plain + cloze + choice, this card's own content only.
  const capstoneNote = notes[0] ?? description;
  const capstoneCloze = buildScaledCloze(capstoneNote, keywords, RECAP_WORD_LIMIT);
  const capstone = {
    id: `${cardKey}-capstone`,
    label: "Alignment Check",
    rounds: [
      {
        id: id(cardKey, "cap-r"),
        cardKey,
        cardName: name,
        // At least 2 distractors, 3 where there's room (0089) - every
        // other "words" round in the app already draws 2-3; this was the
        // one place still asking for just 1.
        words: [
          ...keywords.slice(0, Math.min(3, keywords.length)).map((text) => ({ text, correct: true })),
          ...drawSillyWords(cardKey, 3).map((text) => ({ text, correct: false })),
        ],
      },
      {
        id: id(cardKey, "cap-r"),
        type: "cloze",
        cardKey,
        cardName: name,
        text: capstoneCloze.text,
        blanks: capstoneCloze.blanks,
        distractors: drawSillyWords(cardKey, 2),
      },
      {
        id: id(cardKey, "cap-r"),
        type: "choice",
        cardKey,
        cardName: name,
        prompt: "Which of these is true of this card?",
        correct: shortPhrase(notes[1] ?? notes[0] ?? description),
        // Same 0087 scaffolding as node-6: one genuinely confusable real
        // wrong, one obviously-wrong invented one - a 3-option round with
        // both wrongs maximally confusable is harder than a first
        // encounter needs.
        options: [
          shortPhrase(notes[1] ?? notes[0] ?? description),
          ...otherCardNotes(cardKey, 1, new Set()),
          ...drawSillySentences(1),
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
  // note. This is the card's own first (only) teaching unit, so only one
  // of the three wrong options is a genuinely confusable real reading
  // (otherCardNotes, never repeating a wrong option already used
  // elsewhere in this unit) - the other two are invented, obviously-wrong
  // nonsense (0087), scaffolding a first encounter the way node-1's own
  // easy tier already does for keywords.
  const node6Rounds = notes.map((note, i) => {
    const wrongs = [...otherCardNotes(cardKey, 1, usedDistractorPhrases), ...drawSillySentences(2)];
    return {
      id: id(cardKey, "n6-r"),
      type: "choice",
      prompt: "Which of these is true of this card?",
      correct: shortPhrase(note),
      options: [shortPhrase(note), ...wrongs],
    };
  });
  const node6 = { id: "node-6", rounds: node6Rounds };

  // --- Node 7: The Full Picture - blank count scales with the paragraph's
  // own length (0086) rather than a fixed one-or-two, then keeps only the
  // sentence(s) that actually ended up holding a blank (0085) - the
  // original Fool/Lovers/Empress recap splits its own full description
  // across several short rounds for exactly this reason; showing every
  // sentence in a 50-90 word paragraph when only a couple of its words are
  // tested pushes the word bank below the fold for no benefit.
  const recap = buildScaledCloze(description, keywords, RECAP_WORD_LIMIT);
  const node7 = {
    id: "node-7",
    rounds: [
      {
        id: id(cardKey, "n7-r"),
        type: "cloze",
        text: recap.text,
        blanks: recap.blanks,
        distractors: drawSillyWords(cardKey, 3),
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
