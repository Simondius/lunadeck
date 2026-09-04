// Every round v4 can play, and every story beat, checked for the ways they can
// be unplayable.
//
//   node scripts/check_v4_rounds.mjs
//
// This replaces two checks that were removed with v1 (0082): check_data.py,
// which validated the curriculum CSVs, and check_rounds.mjs, which validated
// what the round builders made of them. Between them they covered the two ways
// a lesson can break — bad data, and data the builders mishandle. Neither had a
// successor, so from that refactor until now nothing looked at v4's 500-plus
// rounds at all, and the only reason that was safe is that nobody had broken
// one yet. CLAUDE.md asks whoever notices to say so; this is instead of saying
// so.
//
// v4 needs only the first half of the old pair. Its rounds are not built from
// anything: node-session.jsx hands the JSON object straight to a player, so the
// data *is* what the player receives and checking the data is checking the
// round. That is why the checks below are written against what each player
// actually reads off its round — see the per-type sections — rather than
// against a schema someone imagined.
//
// The rule this is really here to enforce is the one the deleted checker called
// the one that matters most: an answer that is absent from its own candidates
// traps the learner with every option eliminated and no way to submit.

import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";

const root = process.cwd();

// The dispatch in components/lesson-v2/node-session.jsx. A round whose type is
// not one of these does not fail loudly: `PLAYERS[round.type] ?? RoundPlayer`
// falls back to the keyword player, which then reads a `words` array that a
// zone round has never had. So a typo renders the wrong player and shows
// nothing rather than erroring, which is exactly the kind of quiet break worth
// a check.
const KNOWN_TYPES = new Set(["zone", "cloze", "choice", "tilematch", "swipe"]);

const cardKeys = new Set(
  readFileSync(path.join(root, "data/data_tarot_cards_base.csv"), "utf8")
    .split(/\r?\n/)
    .slice(1)
    .map((line) => line.split(",")[0])
    .filter(Boolean)
);

const problems = [];
function fail(where, detail) {
  problems.push(`${where}\n      ${detail}`);
}

// Duplicate helper: returns the first value that appears twice, or undefined.
const firstDupe = (list) => list.find((v, i) => list.indexOf(v) !== i);

function checkAsset(url, where) {
  if (!url) return fail(where, "empty asset url");
  if (!existsSync(path.join(root, url.replace(/^\//, "")))) {
    fail(where, `missing asset ${url}`);
  }
}

function checkCard(key, where) {
  if (!key) return;
  if (!cardKeys.has(key)) return fail(where, `unknown card key ${key}`);
  checkAsset(`/assets/cards/master/${key}_MASTER.png`, where);
}

// ---------------------------------------------------------------------------
// One round, checked against what its own player reads.
// ---------------------------------------------------------------------------
function checkRound(round, where, sectionCardKey) {
  if (!round.id) fail(where, "round has no id");

  const type = round.type;
  if (type !== undefined && !KNOWN_TYPES.has(type)) {
    fail(where, `unknown round type "${type}" — node-session would render the keyword player`);
    return;
  }

  // node-session.jsx: `round.cardKey ?? cardKey`, so a round without its own
  // inherits the section's. One of the two has to resolve.
  checkCard(round.cardKey ?? sectionCardKey, where);

  // --- untagged: RoundPlayer, reads round.words -----------------------------
  if (type === undefined) {
    const words = round.words;
    if (!Array.isArray(words) || words.length === 0) return fail(where, "no words");
    if (!words.some((w) => w.correct)) fail(where, "no correct word — nothing to pick");
    if (!words.some((w) => !w.correct)) fail(where, "no wrong word — nothing to reject");
    const dupe = firstDupe(words.map((w) => w.text));
    if (dupe) fail(where, `two words read "${dupe}" — indistinguishable options`);
    return;
  }

  // --- choice: reads prompt, options, correct -------------------------------
  if (type === "choice") {
    if (!round.prompt) fail(where, "no prompt");
    const options = round.options;
    if (!Array.isArray(options) || options.length < 2) return fail(where, "fewer than 2 options");
    const timesCorrect = options.filter((o) => o === round.correct).length;
    if (timesCorrect === 0) {
      // The one that matters most.
      fail(where, `the answer is not among its own options: ${JSON.stringify(round.correct)}`);
    } else if (timesCorrect > 1) {
      fail(where, `the answer appears ${timesCorrect} times — more than one option is right`);
    }
    const dupe = firstDupe(options);
    if (dupe) fail(where, `two options read ${JSON.stringify(dupe)}`);
    return;
  }

  // --- cloze: reads text, blanks, distractors ------------------------------
  //
  // The draggable options are the blanks' own answers plus the distractors
  // (cloze-round-player.jsx builds `real` then `wrong` from exactly those), so
  // a distractor equal to an answer puts the same word on screen twice with
  // only one of them accepted.
  if (type === "cloze") {
    const text = round.text ?? "";
    const blanks = round.blanks;
    if (!text) fail(where, "no text");
    if (!Array.isArray(blanks) || blanks.length === 0) return fail(where, "no blanks");
    if (!Array.isArray(round.distractors)) fail(where, "distractors is not an array");

    for (const blank of blanks) {
      if (!blank.key) fail(where, "a blank has no key");
      if (!blank.answer) fail(where, `blank ${blank.key} has no answer`);
      if (blank.key && !text.includes(`{${blank.key}}`)) {
        fail(where, `blank ${blank.key} never appears in the text — it can never be filled`);
      }
      if ((round.distractors ?? []).includes(blank.answer)) {
        fail(where, `distractor "${blank.answer}" is also an answer`);
      }
    }
    for (const match of text.matchAll(/\{([a-z0-9]+)\}/gi)) {
      if (!blanks.some((b) => b.key === match[1])) {
        fail(where, `the text has {${match[1]}} but no blank defines it`);
      }
    }
    const dupeAnswer = firstDupe(blanks.map((b) => b.answer));
    if (dupeAnswer) fail(where, `two blanks answer "${dupeAnswer}" — two identical chips`);
    const dupeKey = firstDupe(blanks.map((b) => b.key));
    if (dupeKey) fail(where, `two blanks share the key ${dupeKey}`);
    return;
  }

  // --- zone: reads elements ------------------------------------------------
  if (type === "zone") {
    const elements = round.elements;
    if (!Array.isArray(elements) || elements.length === 0) return fail(where, "no elements");
    for (const element of elements) {
      if (!element.key) fail(where, "an element has no key");
      if (!element.text) fail(where, `element ${element.key} has no text`);
      const rects = element.rects;
      if (!Array.isArray(rects) || rects.length === 0) {
        fail(where, `element ${element.key} has no rects — nowhere to drop it`);
        continue;
      }
      for (const rect of rects) {
        const { x0, y0, x1, y1 } = rect;
        const nums = [x0, y0, x1, y1];
        if (!nums.every((n) => typeof n === "number" && n >= 0 && n <= 1)) {
          fail(where, `element ${element.key} rect outside 0..1: ${JSON.stringify(rect)}`);
        } else if (x1 <= x0 || y1 <= y0) {
          fail(where, `element ${element.key} rect has no area: ${JSON.stringify(rect)}`);
        }
      }
    }
    const dupe = firstDupe(elements.map((e) => e.key));
    if (dupe) fail(where, `two elements share the key ${dupe}`);
    return;
  }

  // --- tilematch: reads pairs ---------------------------------------------
  if (type === "tilematch") {
    const pairs = round.pairs;
    if (!Array.isArray(pairs) || pairs.length < 2) return fail(where, "fewer than 2 pairs");
    for (const pair of pairs) {
      if (!pair.key) fail(where, "a pair has no key");
      if (!pair.text) fail(where, `pair ${pair.key} has no text`);
      checkAsset(pair.image, `${where} pair ${pair.key}`);
    }
    const dupeKey = firstDupe(pairs.map((p) => p.key));
    if (dupeKey) fail(where, `two pairs share the key ${dupeKey}`);
    // Two tiles showing the same picture cannot be told apart.
    const dupeImage = firstDupe(pairs.map((p) => p.image));
    if (dupeImage) fail(where, `two pairs show the same image ${dupeImage}`);
    return;
  }

  // --- swipe: reads cards -------------------------------------------------
  if (type === "swipe") {
    const cards = round.cards;
    if (!Array.isArray(cards) || cards.length === 0) return fail(where, "no cards");
    if (!cards.some((c) => c.isMatch)) fail(where, "nothing to keep — every card is a reject");
    if (!cards.some((c) => !c.isMatch)) fail(where, "nothing to reject — every card is a match");
    const dupe = firstDupe(cards.map((c) => c.text));
    if (dupe) fail(where, `two cards read "${dupe}"`);
  }
}

// ---------------------------------------------------------------------------
// v4's lesson content.
// ---------------------------------------------------------------------------
let roundCount = 0;
const v4Dir = path.join(root, "data/v4");
const v4Files = readdirSync(v4Dir).filter((f) => f.endsWith(".json"));

if (v4Files.length === 0) fail("data/v4", "no section JSON — this script is checking nothing");

for (const file of v4Files) {
  let json;
  try {
    json = JSON.parse(readFileSync(path.join(v4Dir, file), "utf8"));
  } catch (error) {
    fail(`data/v4/${file}`, `not valid JSON: ${error.message}`);
    continue;
  }

  // The files differ in shape (a section wraps nodes; the mashup and capstone
  // files are flatter), so the rounds are found rather than walked to by a
  // fixed path. `cardKey` is picked up from whatever object encloses them.
  const visit = (value, inheritedCardKey) => {
    if (Array.isArray(value)) {
      for (const item of value) visit(item, inheritedCardKey);
      return;
    }
    if (!value || typeof value !== "object") return;

    const cardKey = value.cardKey ?? inheritedCardKey;

    if (Array.isArray(value.rounds)) {
      // Ids are scoped to the round list they sit in, not to the file. A
      // session plays one node, and node-session.jsx builds its React key as
      // `main-${round.id}` — so two rounds in the SAME list sharing an id
      // share a key, and the remount that key exists to force does not
      // happen. The same id in two different nodes is fine and common: they
      // are never on screen in the same session.
      const seenIds = new Set();

      for (const round of value.rounds) {
        roundCount += 1;
        const where = `data/v4/${file} ${round.id ?? "(no id)"}`;
        if (round.id) {
          if (seenIds.has(round.id)) {
            fail(
              where,
              "two rounds in this node share this id — they share a React key, " +
                "so the second reuses the first's component instead of mounting fresh"
            );
          }
          seenIds.add(round.id);
        }
        checkRound(round, where, cardKey);
      }
    }

    for (const key of Object.keys(value)) {
      if (key === "rounds") continue;
      visit(value[key], cardKey);
    }
  };
  visit(json, undefined);
}

// ---------------------------------------------------------------------------
// Story beats. A different shape, the same failure: a choice with nothing
// correct in it cannot be answered, and the reader cannot advance past it.
// ---------------------------------------------------------------------------
let beatCount = 0;
const storyDir = path.join(root, "data/story");

for (const file of readdirSync(storyDir).filter((f) => f.endsWith(".json"))) {
  let chapter;
  try {
    chapter = JSON.parse(readFileSync(path.join(storyDir, file), "utf8"));
  } catch (error) {
    fail(`data/story/${file}`, `not valid JSON: ${error.message}`);
    continue;
  }

  const beats = chapter.beats ?? [];
  if (beats.length === 0) fail(`data/story/${file}`, "chapter has no beats");

  for (const [i, beat] of beats.entries()) {
    beatCount += 1;
    const where = `data/story/${file} beat ${i} (${beat.type})`;

    if (beat.type === "choice") {
      const options = beat.options;
      if (!Array.isArray(options) || options.length < 2) {
        fail(where, "fewer than 2 options");
        continue;
      }
      const right = options.filter((o) => o.correct).length;
      if (right === 0) fail(where, "no option is correct — the reader cannot get past this beat");
      if (right > 1) fail(where, `${right} options are correct`);
      for (const option of options) if (!option.text) fail(where, "an option has no text");
      const dupe = firstDupe(options.map((o) => o.text));
      if (dupe) fail(where, `two options read "${dupe}"`);
    }

    if (beat.type === "reveal") checkCard(beat.card, where);
    if (beat.type === "dialogue" && !beat.text) fail(where, "dialogue beat has no text");
  }
}

// ---------------------------------------------------------------------------
if (problems.length === 0) {
  console.log(
    `${roundCount} v4 rounds and ${beatCount} story beats checked, all playable`
  );
  process.exit(0);
}

console.error(`\n  ${problems.length} problems:\n`);
for (const problem of problems) console.error(`    ${problem}`);
console.error("");
process.exit(1);
