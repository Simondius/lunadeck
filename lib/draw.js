// Which card tonight's draw lands on.
//
// Pool weights come from Spec_Daily_Draw_Tab Section 4. They are tunable by
// design — the spec says so explicitly — so they live here as one table rather
// than scattered through the picker.
//
// Everything is seeded by the calendar date, so the same day always deals the
// same card. Without that, reloading the tab would reroll until you liked the
// answer, and the draw would mean nothing.

export const POOL_WEIGHTS = [
  // The wall should fill roughly in step with curriculum progress.
  { id: "taught", weight: 70 },
  // Preview slot — curiosity about what's coming.
  { id: "preview", weight: 10 },
  // Keeps the full 78 reachable before the curriculum has taught everything.
  { id: "any", weight: 5 },
  // Draws a card you already know, reversed. This is what completes a card's
  // "both sides" state.
  { id: "reversed", weight: 15 },
];

function hash(seed) {
  let value = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    value ^= seed.charCodeAt(i);
    value = Math.imul(value, 16777619) >>> 0;
  }
  return value >>> 0;
}

export function buildPools({ cards, knownKeys, drawnKeys, reversedKeys, currentUnit }) {
  const known = new Set(knownKeys);
  const drawn = new Set(drawnKeys);
  const reversed = new Set(reversedKeys);

  const undrawn = cards.filter((c) => !drawn.has(c.key));

  return {
    taught: undrawn.filter((c) => known.has(c.key)),
    preview: undrawn.filter(
      (c) => !known.has(c.key) && c.unit > currentUnit && c.unit <= currentUnit + 2
    ),
    any: undrawn,
    reversed: cards.filter((c) => drawn.has(c.key) && !reversed.has(c.key)),
  };
}

// Returns { card, reversed } or null when there is genuinely nothing left —
// every card seen both ways.
export function pickDraw({
  cards,
  knownKeys = [],
  drawnKeys = [],
  reversedKeys = [],
  currentUnit = 1,
  seed = "",
}) {
  if (!cards.length) return null;

  const pools = buildPools({ cards, knownKeys, drawnKeys, reversedKeys, currentUnit });
  const live = POOL_WEIGHTS.filter((p) => pools[p.id].length > 0);
  if (live.length === 0) return null;

  const total = live.reduce((sum, p) => sum + p.weight, 0);
  let roll = hash(`${seed}|pool`) % total;
  let chosen = live[live.length - 1];
  for (const pool of live) {
    if (roll < pool.weight) {
      chosen = pool;
      break;
    }
    roll -= pool.weight;
  }

  const options = pools[chosen.id];
  const card = options[hash(`${seed}|${chosen.id}`) % options.length];
  return { card, reversed: chosen.id === "reversed" };
}
