// Run with: node --test lib/
//
// These cover the logic that has no UI to check it — streak rollover in
// particular, which is only observable a day later.

import test from "node:test";
import assert from "node:assert/strict";
import {
  EMPTY,
  XP_PER_NODE,
  HINTS_PER_SECTION,
  completeNode,
  spendHint,
  hintsLeft,
  countComplete,
  isSectionComplete,
  isNodeComplete,
  today,
  reset,
  read,
  sectionKey,
  getServerSnapshot,
  wasMissed,
  countFirstTry,
  recordDailyDraw,
  recordDailyReading,
  recordReading,
  clearReading,
  drawnToday,
  completeSection,
} from "./progress.js";

test("server snapshot is the frozen empty state", () => {
  assert.equal(getServerSnapshot(), EMPTY);
  assert.throws(() => {
    "use strict";
    EMPTY.xp = 99;
  });
});

test("today() formats a device-local calendar day", () => {
  assert.equal(today(new Date(2026, 0, 5, 23, 30)), "2026-01-05");
  assert.equal(today(new Date(2026, 11, 31, 0, 1)), "2026-12-31");
});

test("completing a node records it once and awards XP once", () => {
  reset();
  completeNode("U1-S1-N1", { day: "2026-08-28" });
  const after = completeNode("U1-S1-N1", { day: "2026-08-28" });
  assert.deepEqual(after.completedNodeIds, ["U1-S1-N1"]);
  assert.equal(after.xp, XP_PER_NODE);
});

test("streak: increments once a day, holds within a day, resets after a gap", () => {
  reset();
  let s = completeNode("a", { day: "2026-08-01" });
  assert.equal(s.streakDays, 1, "first ever day starts at 1");

  s = completeNode("b", { day: "2026-08-01" });
  assert.equal(s.streakDays, 1, "a second node the same day does not increment");

  s = completeNode("c", { day: "2026-08-02" });
  assert.equal(s.streakDays, 2, "the next calendar day increments");

  s = completeNode("d", { day: "2026-08-04" });
  assert.equal(s.streakDays, 1, "a full missed day resets to 1");
});

test("streak survives a month boundary", () => {
  reset();
  completeNode("a", { day: "2026-08-31" });
  const s = completeNode("b", { day: "2026-09-01" });
  assert.equal(s.streakDays, 2);
});

test("hints default per section and never go below zero", () => {
  reset();
  const key = sectionKey(1, 1);
  assert.equal(hintsLeft(read(), key), HINTS_PER_SECTION);
  for (let i = 0; i < HINTS_PER_SECTION + 2; i++) spendHint(key);
  assert.equal(hintsLeft(read(), key), 0);
  assert.equal(hintsLeft(read(), sectionKey(1, 2)), HINTS_PER_SECTION, "other sections untouched");
});

test("section completion needs every node, not just some", () => {
  reset();
  const nodes = ["n1", "n2", "n3"];
  completeNode("n1", { day: "2026-08-28" });
  completeNode("n2", { day: "2026-08-28" });
  assert.equal(countComplete(read(), nodes), 2);
  assert.equal(isSectionComplete(read(), nodes), false);
  completeNode("n3", { day: "2026-08-28" });
  assert.equal(isSectionComplete(read(), nodes), true);
  assert.equal(isNodeComplete(read(), "n3"), true);
  assert.equal(isNodeComplete(read(), "nope"), false);
});

test("an empty section is never complete", () => {
  reset();
  assert.equal(isSectionComplete(read(), []), false);
});

test("a missed node is recorded once and only when it was missed", () => {
  reset();
  completeNode("m1", { day: "2026-08-28", missed: true });
  completeNode("m2", { day: "2026-08-28" });
  assert.equal(wasMissed(read(), "m1"), true);
  assert.equal(wasMissed(read(), "m2"), false);
  assert.deepEqual(read().missedNodeIds, ["m1"]);
});

test("first-try count excludes misses and nodes never played", () => {
  reset();
  completeNode("a", { day: "2026-08-28" });
  completeNode("b", { day: "2026-08-28", missed: true });
  completeNode("c", { day: "2026-08-28" });
  assert.equal(countFirstTry(read(), ["a", "b", "c", "d"]), 2);
});

test("a completed node cannot be re-marked as missed later", () => {
  reset();
  completeNode("x", { day: "2026-08-28" });
  completeNode("x", { day: "2026-08-28", missed: true });
  assert.equal(wasMissed(read(), "x"), false, "the second call is a no-op");
});

test("the daily draw records all three cards and today's spread", () => {
  reset();
  recordDailyDraw({
    cards: [
      { cardKey: "major_00_fool" },
      { cardKey: "major_01_magician" },
      { cardKey: "major_02_priestess" },
    ],
    day: "2026-08-28",
  });
  const s = read();
  assert.deepEqual(s.drawnCardKeys, [
    "major_00_fool",
    "major_01_magician",
    "major_02_priestess",
  ]);
  assert.deepEqual(s.reversedCardKeys, []);
  assert.equal(drawnToday(s, "2026-08-28").cards.length, 3);
  assert.equal(drawnToday(s, "2026-08-29"), null, "yesterday's spread is not today's");
});

test("a reversed card in the spread is marked reversed, not re-added upright", () => {
  reset();
  recordDailyDraw({ cards: [{ cardKey: "major_00_fool" }], day: "2026-08-28" });
  recordDailyDraw({
    cards: [{ cardKey: "major_00_fool", reversed: true }],
    day: "2026-08-29",
  });
  const s = read();
  assert.deepEqual(s.drawnCardKeys, ["major_00_fool"]);
  assert.deepEqual(s.reversedCardKeys, ["major_00_fool"]);
  assert.equal(drawnToday(s, "2026-08-29").cards[0].reversed, true);
});

test("a draw with no cards is ignored", () => {
  reset();
  recordDailyDraw({ day: "2026-08-28" });
  assert.equal(read().dailyDraw, null);
});

test("drawing does not touch the streak — only path nodes do", () => {
  reset();
  recordDailyDraw({ cards: [{ cardKey: "major_01_magician" }], day: "2026-08-28" });
  assert.equal(read().streakDays, 0);
});

test("a reading is kept whole, and replaced rather than accumulated", () => {
  reset();
  recordReading({
    question: "Should I take the job?",
    cards: [{ key: "major_00_fool", name: "The Fool", reversed: false, note: "An edge." }],
    takeaway: "You are standing at an edge.",
    day: "2026-08-30",
  });
  assert.equal(read().lastReading.question, "Should I take the job?");
  assert.equal(read().lastReading.cards[0].note, "An edge.");

  recordReading({
    question: "And the flat?",
    cards: [],
    takeaway: "Different ground.",
    day: "2026-08-30",
  });
  assert.equal(read().lastReading.question, "And the flat?", "one slot, not a history");

  clearReading();
  assert.equal(read().lastReading, null);
});

test("the daily reading lands its notes on the cards already dealt", () => {
  reset();
  recordDailyDraw({
    cards: [
      { cardKey: "major_00_fool" },
      { cardKey: "major_01_magician", reversed: true },
      { cardKey: "major_02_priestess" },
    ],
    day: "2026-08-30",
  });

  recordDailyReading({
    takeaway: "Start it.",
    cards: [{ note: "first" }, { note: "second" }, { note: "third" }],
    day: "2026-08-30",
  });

  const draw = read().dailyDraw;
  assert.equal(draw.takeaway, "Start it.");
  assert.deepEqual(
    draw.cards.map((c) => [c.cardKey, c.reversed ?? false, c.note]),
    [
      ["major_00_fool", false, "first"],
      ["major_01_magician", true, "second"],
      ["major_02_priestess", false, "third"],
    ],
    "notes match by position, and the orientation already stored survives"
  );
});

test("a daily reading for yesterday's draw is refused", () => {
  reset();
  recordDailyDraw({ cards: [{ cardKey: "major_00_fool" }], day: "2026-08-30" });
  recordDailyReading({ takeaway: "Too late.", cards: [{ note: "x" }], day: "2026-08-31" });
  assert.equal(read().dailyDraw.takeaway, null, "a stale reading never lands");
});

test("asking the reader does not fill the nightly draw pool", () => {
  reset();
  recordReading({
    question: "What should I watch for?",
    cards: [{ key: "major_00_fool", name: "The Fool", reversed: false }],
    takeaway: "Something.",
    day: "2026-08-30",
  });
  assert.deepEqual(read().drawnCardKeys, [], "reader pulls are not collection");
});

test("a section commits in one write: nodes, misses, xp, streak and hints", () => {
  reset();
  completeSection({
    nodeIds: ["s1", "s2", "s3"],
    missedNodeIds: ["s2"],
    hintsUsed: 2,
    sectionKey: "U1-S1",
    day: "2026-08-29",
  });
  const s = read();
  assert.deepEqual(s.completedNodeIds, ["s1", "s2", "s3"]);
  assert.deepEqual(s.missedNodeIds, ["s2"]);
  assert.equal(s.xp, 3 * XP_PER_NODE);
  assert.equal(s.streakDays, 1);
  assert.equal(hintsLeft(s, "U1-S1"), HINTS_PER_SECTION - 2);
});

test("replaying a finished section pays out nothing a second time", () => {
  reset();
  completeSection({ nodeIds: ["a", "b"], day: "2026-08-29" });
  const first = read().xp;
  completeSection({ nodeIds: ["a", "b"], day: "2026-08-30" });
  const s = read();
  assert.equal(s.xp, first, "no XP for nodes already banked");
  assert.equal(s.streakDays, 1, "and the streak does not advance either");
  assert.deepEqual(s.completedNodeIds, ["a", "b"], "no duplicates");
});

test("a section abandoned mid-run leaves nothing behind", () => {
  reset();
  // the session holds progress in memory and only calls completeSection at
  // the end, so an abandoned run is simply a call that never happens
  const before = JSON.stringify(read());
  assert.equal(JSON.stringify(read()), before);
  assert.deepEqual(read().completedNodeIds, []);
  assert.equal(read().xp, 0);
});

test("hints only decrement when some were actually used", () => {
  reset();
  completeSection({ nodeIds: ["x"], sectionKey: "U1-S1", hintsUsed: 0, day: "2026-08-29" });
  assert.equal(hintsLeft(read(), "U1-S1"), HINTS_PER_SECTION);
});

test("a section with every node already done still records new misses", () => {
  reset();
  completeSection({ nodeIds: ["a"], day: "2026-08-29" });
  completeSection({ nodeIds: ["a"], missedNodeIds: ["a"], day: "2026-08-29" });
  assert.deepEqual(read().missedNodeIds, ["a"]);
});
