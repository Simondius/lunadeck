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
