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
const { getSession, getUnits } = await import(
  pathToFileURL(path.join(root, "lib/data.js")).href
);

const problems = [];
const assets = new Set();
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

function checkB(round, where) {
  asset(round.image, `${where} card`);
  if (!String(round.statement || "").trim()) fail(where, "empty statement");
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
      if (round.kind === "A") checkA(round, where);
      else if (round.kind === "B") checkB(round, where);
      else if (round.kind === "C") checkC(round, where);
      else fail(where, `unknown round kind ${round.kind}`);
    });
  }
}

console.log(`${nodeCount} nodes -> ${instanceCount} instances`);
console.log("instances by format:", byFormat);
console.log(`true/false balance: ${trueRounds} / ${falseRounds}`);
console.log(`${assets.size} distinct assets referenced, all present`);

if (problems.length) {
  console.log(`\n${problems.length} problem(s):\n`);
  for (const problem of problems.slice(0, 40)) console.log("  " + problem);
  if (problems.length > 40) console.log(`  …and ${problems.length - 40} more`);
  process.exit(1);
}
console.log("\nevery round is playable");
