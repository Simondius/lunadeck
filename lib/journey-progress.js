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
  // Has this browser ever actually entered the full-bleed beat player
  // (journey-player.jsx), through any route? Simon's 0906 spec: the
  // very first time ever, the JOURNEY tab should skip the home/preview
  // screen (journey-home-screen.jsx) and drop straight into the
  // full-bleed "*Thud*" beat, the way "/" used to redirect before that
  // screen existed - the preview screen (two cards + "Continue Journey")
  // is where every visit AFTER that first one lands, including right
  // after exiting the player via its X. journey-player.jsx sets this the
  // moment it mounts (any entry path - not just via the home screen's
  // own redirect), so a reader who somehow reaches the player straight
  // (a bookmark, a dev-console link) still flips it, and the home screen
  // never loops them straight back into the player once they've X'd out.
  hasStarted: false,
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
      hasStarted: Boolean(parsed?.hasStarted),
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

export function hasStartedJourney() {
  return read().hasStarted;
}

export function markJourneyStarted() {
  const current = read();
  if (current.hasStarted) return current;
  const next = { ...current, hasStarted: true };
  write(next);
  return next;
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
