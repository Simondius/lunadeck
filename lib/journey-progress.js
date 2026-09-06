// Client-side progress store for Journey mode.
//
// Deliberately a SEPARATE store from lib/progress.js (Path/v4's
// lunadeck.progress.v1) and from Guide's own store — same precedent: each
// feature's progress model is shaped differently enough (Journey tracks
// completed *units*, not nodes) that unifying them early would mean
// designing a shared shape before Journey's own two-way narrative<->deck
// gating actually exists. Revisit once that gating is being built for real,
// not before.
//
// Safe to import from a server component: every entry point degrades to
// the empty state when there is no window.

export const STORAGE_KEY = "lunadeck.journey.v1";

export const EMPTY = Object.freeze({
  version: 1,
  completedUnitSlugs: Object.freeze([]),
});

function hasStorage() {
  try {
    return typeof window !== "undefined" && !!window.localStorage;
  } catch {
    // Some browsers throw on property access alone when site data is blocked.
    return false;
  }
}

export function read() {
  if (!hasStorage()) return EMPTY;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw);
    return {
      version: 1,
      completedUnitSlugs: Array.isArray(parsed?.completedUnitSlugs)
        ? parsed.completedUnitSlugs
        : [],
    };
  } catch {
    return EMPTY;
  }
}

export function write(state) {
  if (!hasStorage()) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Blocked/full storage - progress just won't persist across reloads.
  }
}

export function isUnitComplete(slug) {
  return read().completedUnitSlugs.includes(slug);
}

export function completeUnit(slug) {
  const current = read();
  if (current.completedUnitSlugs.includes(slug)) return current;
  const next = {
    ...current,
    completedUnitSlugs: [...current.completedUnitSlugs, slug],
  };
  write(next);
  return next;
}

// The card keys a reader has unlocked into their deck by finishing a
// unit - used later to gate/inform the deck side of Journey's two-way
// progress once that view exists.
export function knownCardKeys(units) {
  const completed = new Set(read().completedUnitSlugs);
  return units.filter((unit) => completed.has(unit.slug)).map((unit) => unit.cardKey);
}
