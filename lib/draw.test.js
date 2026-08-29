import test from "node:test";
import assert from "node:assert/strict";
import { pickDraw, buildPools, POOL_WEIGHTS } from "./draw.js";

const CARDS = Array.from({ length: 20 }, (_, i) => ({
  key: `c${i}`,
  unit: Math.floor(i / 4) + 1, // 4 cards per unit, units 1-5
}));

test("the same day always deals the same card", () => {
  const a = pickDraw({ cards: CARDS, seed: "2026-08-29" });
  const b = pickDraw({ cards: CARDS, seed: "2026-08-29" });
  assert.deepEqual(a, b);
});

test("different days generally deal different cards", () => {
  const seen = new Set();
  for (let d = 1; d <= 28; d++) {
    seen.add(pickDraw({ cards: CARDS, seed: `2026-09-${d}` }).card.key);
  }
  assert.ok(seen.size > 5, `expected spread across days, got ${seen.size}`);
});

test("pools partition correctly", () => {
  const pools = buildPools({
    cards: CARDS,
    knownKeys: ["c0", "c1"],
    drawnKeys: ["c1"],
    reversedKeys: [],
    currentUnit: 1,
  });
  assert.deepEqual(pools.taught.map((c) => c.key), ["c0"], "known and not yet drawn");
  assert.ok(!pools.any.some((c) => c.key === "c1"), "a drawn card is not in 'any'");
  assert.deepEqual(pools.reversed.map((c) => c.key), ["c1"], "drawn but not reversed");
  assert.ok(
    pools.preview.every((c) => c.unit > 1 && c.unit <= 3),
    "preview only looks 1-2 units ahead"
  );
});

test("a card already seen both ways is retired from every pool", () => {
  const pools = buildPools({
    cards: CARDS,
    knownKeys: [],
    drawnKeys: ["c5"],
    reversedKeys: ["c5"],
    currentUnit: 1,
  });
  for (const id of Object.keys(pools)) {
    assert.ok(!pools[id].some((c) => c.key === "c5"), `c5 leaked into ${id}`);
  }
});

test("with everything drawn upright, every draw is a reversed one", () => {
  const drawn = CARDS.map((c) => c.key);
  for (let d = 1; d <= 10; d++) {
    const r = pickDraw({ cards: CARDS, drawnKeys: drawn, seed: `2026-10-${d}` });
    assert.equal(r.reversed, true);
  }
});

test("a completed deck returns null rather than dealing nothing", () => {
  const all = CARDS.map((c) => c.key);
  assert.equal(
    pickDraw({ cards: CARDS, drawnKeys: all, reversedKeys: all, seed: "x" }),
    null
  );
});

test("an empty deck is handled", () => {
  assert.equal(pickDraw({ cards: [], seed: "x" }), null);
});

test("a brand-new learner still gets a card", () => {
  const r = pickDraw({ cards: CARDS, knownKeys: [], seed: "2026-08-29", currentUnit: 1 });
  assert.ok(r && r.card, "no taught cards yet, but the draw still falls through");
  assert.equal(r.reversed, false);
});

test("weights are the ones the spec names", () => {
  assert.deepEqual(
    POOL_WEIGHTS.map((p) => [p.id, p.weight]),
    [["taught", 70], ["preview", 10], ["any", 5], ["reversed", 15]]
  );
});
