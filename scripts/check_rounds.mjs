// Builds every round the curriculum can produce and checks it is playable.
//
//   node scripts/check_rounds.mjs
//
// check_data.py validates the CSVs; this validates what lib/rounds.js makes of
// them. Between them they cover the two ways a lesson can be broken: bad data,
// and data the builders mishandle.
//
// Run it after touching lib/rounds.js, lib/data.js or anything in data/.

import { existsSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const root = process.cwd();
const { getSession, getUnits, getCardNames } = await import(
  pathToFileURL(path.join(root, "lib/data.js")).href
);
// The same packer the rounds use, so this asserts the real rule rather than a
// second copy of it that can drift.
const { fitsTwoRows } = await import(
  pathToFileURL(path.join(root, "lib/rounds.js")).href
);

const names = await getCardNames();
const problems = [];
const notes = [];
const assets = new Set();

// UX Style Guide Section 4: a candidate must never carry the identity that
// answers the question, even when the same name is shown on the fixed
// reference above it. This missed 82 A2 nodes until someone played the course
// and spotted "The Fool stands at…" sitting under a card labelled The Fool.
const SHARED_WORDS = new Set(["the", "of", "a", "and"]);

function namesCard(text, cardName) {
  if (!cardName || !text) return false;
  return cardName
    .split(/[^A-Za-z]+/)
    .filter((w) => w && !SHARED_WORDS.has(w.toLowerCase()))
    .some((w) => new RegExp(`\\b${w}\\b`, "i").test(text));
}
let nodeCount = 0;
let instanceCount = 0;
const byFormat = {};
let trueRounds = 0;
let falseRounds = 0;

const fail = (where, message) => problems.push(`${where}: ${message}`);

function asset(url, where) {
  if (!url) return fail(where, "empty asset url");
  if (assets.has(url)) return;
  assets.add(url);
  if (!existsSync(path.join(root, url.replace(/^\//, "")))) {
    fail(where, `missing asset ${url}`);
  }
}

function checkReference(ref, where) {
  if (!ref) return fail(where, "no reference");
  switch (ref.type) {
    case "card":
    case "symbol":
      return asset(ref.image, `${where} reference`);
    case "chips":
      if (!ref.items?.length) fail(where, "empty keyword anchor");
      return;
    case "prose":
      if (!String(ref.text || "").trim()) fail(where, "empty prose anchor");
      return;
    // A7's label anchor is a category over a name, not one string.
    case "label":
      if (!String(ref.category || "").trim() || !String(ref.name || "").trim()) {
        fail(where, "incomplete label anchor");
      }
      return;
    default:
      return fail(where, `unknown reference type ${ref.type}`);
  }
}

function checkA(round, where) {
  const keys = round.candidates.items.map((o) => o.key);
  if (new Set(keys).size !== keys.length) fail(where, `duplicate candidate keys ${keys}`);
  // The one that matters most: an answer absent from its own candidates traps
  // the learner with every option eliminated and no way to submit.
  if (!keys.includes(round.answerKey))
    fail(where, `answerKey ${round.answerKey} is not among ${keys}`);
  if (keys.length < 2 || keys.length > 4)
    fail(where, `${keys.length} candidates (the Bible allows 2-4)`);
  if (!round.prompt) fail(where, "no prompt");

  for (const option of round.candidates.items) {
    if (round.candidates.type === "text") {
      if (!String(option.text || "").trim()) fail(where, `empty text option ${option.key}`);
      if (namesCard(option.text, names.get(option.key))) {
        fail(where, `option names its own card (${names.get(option.key)})`);
      }
    } else {
      asset(option.image, `${where} option ${option.key}`);
    }
  }
  checkReference(round.reference, where);

  // A candidate must never name the answer it is hiding.
  if (round.reference.type === "label") {
    for (const option of round.candidates.items) {
      if (option.label || option.text) fail(where, "A7 candidate is labelled");
    }
  }
}

// A round that quizzes a card's own content has to say what it assumes the
// learner was shown, or the play page cannot put a teaching beat in front of
// it and the section quizzes material nobody taught. That is how the symbol
// formats went three decisions with no teaching at all (0018) — nothing failed,
// the screen just quietly asked for something the course had stopped showing.
//
// A3 is the one exemption: it tests a category, not the card's content.
const TEACHLESS = new Set(["A3"]);

function checkTeaches(round, node, where) {
  if (TEACHLESS.has(node.formatCode)) return;
  if (!round.teaches) {
    fail(where, "declares no needs() topic — the play page cannot teach it");
    return;
  }
  if (!round.teachesFor?.length)
    fail(where, `needs("${round.teaches}") names no cards`);
}

function checkK(round, where) {
  if (!round.chips?.length) return fail(where, "no keyword chips");
  const correct = round.chips.filter((c) => c.correct);
  if (correct.length === 0) fail(where, "no correct keyword to find");
  if (correct.length !== round.correctCount)
    fail(where, `correctCount says ${round.correctCount}, chips say ${correct.length}`);
  const texts = round.chips.map((c) => c.text.toLowerCase());
  if (new Set(texts).size !== texts.length)
    fail(where, "the same keyword appears twice in the pool");
  // 31 keywords in the deck belong to more than one card, so a distractor can
  // silently be a genuine keyword of the target. That would mark a right
  // answer wrong.
  const own = new Set(correct.map((c) => c.text.toLowerCase()));
  for (const chip of round.chips) {
    if (!chip.correct && own.has(chip.text.toLowerCase()))
      fail(where, `"${chip.text}" is marked wrong but is one of the card's own keywords`);
  }
  if (correct.length > 3)
    fail(where, `${correct.length} keywords asked for (the core set is at most 3)`);
  const distractors = round.chips.length - correct.length;
  if (distractors < 2 || distractors > correct.length + 1)
    fail(where, `${distractors} distractors (want 2 to ${correct.length + 1})`);
  // The set has to land inside two lines on the narrowest phone. The packer
  // trims until it does; this is the assertion that it worked, and the alarm
  // if the chip styling ever outgrows the estimate the packer uses.
  if (!fitsTwoRows(round.chips.map((c) => c.text), round.compact))
    fail(where, `chips spill past two lines: ${round.chips.map((c) => c.text).join(", ")}`);
  checkReference(round.reference, where);
}

function checkB(round, where) {
  asset(round.image, `${where} card`);
  if (!String(round.statement || "").trim()) fail(where, "empty statement");
  if (namesCard(round.statement, round.cardName)) {
    fail(where, `statement names the card it is shown with (${round.cardName})`);
  }
  if (round.isTrue && round.donor) fail(where, "a true round has a donor");
  if (!round.isTrue && !round.donor) fail(where, "a false round has no donor");
  if (round.donor) {
    asset(round.donor.image, `${where} donor`);
    if (round.donor.statement !== round.statement)
      fail(where, "the donor's statement differs from the one shown");
  }
  round.isTrue ? trueRounds++ : falseRounds++;
}

function checkC(round, where) {
  if (round.pairs.length < 2 || round.pairs.length > 3)
    fail(where, `board of ${round.pairs.length} rows (the Style Guide allows 2-3)`);
  const keys = round.pairs.map((p) => p.key);
  if (new Set(keys).size !== keys.length) fail(where, "the same card twice on one board");
  for (const pair of round.pairs) {
    asset(pair.image, `${where} tile ${pair.key}`);
    if (!String(pair.text || "").trim()) fail(where, `empty meaning for ${pair.key}`);
    // Reported, not failed. A board's text is description_anonymized, of which
    // there is exactly one per card — nothing to select between — and the
    // remaining hits are ordinary words that happen to be a card's name
    // ("Fortune and misfortune…" for The Wheel of Fortune). Fixing them means
    // editing guidebook prose, which is a content decision, not a code one.
    if (namesCard(pair.text, names.get(pair.key))) {
      notes.push(`${where}: board text contains "${names.get(pair.key)}"`);
    }
    if (!pair.name) fail(where, `unnamed tile ${pair.key}`);
  }
  if (!round.seed) fail(where, "no board seed — the right column would not shuffle per board");
}

for (const unit of await getUnits()) {
  for (const node of await getSession(unit.number)) {
    nodeCount++;
    if (!node.playable) {
      fail(node.nodeId, `${node.formatCode} produced no playable round`);
      continue;
    }
    byFormat[node.formatCode] = (byFormat[node.formatCode] || 0) + node.instances.length;
    node.instances.forEach((round, i) => {
      instanceCount++;
      const where = `${node.nodeId} ${node.formatCode} #${i + 1}`;
      checkTeaches(round, node, where);
      if (round.kind === "A") checkA(round, where);
      else if (round.kind === "B") checkB(round, where);
      else if (round.kind === "C") checkC(round, where);
      else if (round.kind === "K") checkK(round, where);
      else fail(where, `unknown round kind ${round.kind}`);
    });
  }
}

console.log(`${nodeCount} nodes -> ${instanceCount} instances`);
console.log("instances by format:", byFormat);
console.log(`true/false balance: ${trueRounds} / ${falseRounds}`);
console.log(`${assets.size} distinct assets referenced, all present`);

if (notes.length) {
  console.log(`\n${notes.length} board text(s) contain their card's name — content, not code:`);
  for (const note of notes.slice(0, 5)) console.log("  " + note);
  if (notes.length > 5) console.log(`  …and ${notes.length - 5} more`);
}

if (problems.length) {
  console.log(`\n${problems.length} problem(s):\n`);
  for (const problem of problems.slice(0, 40)) console.log("  " + problem);
  if (problems.length > 40) console.log(`  …and ${problems.length - 40} more`);
  process.exit(1);
}
console.log("\nevery round is playable");
