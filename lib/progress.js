// Client-side progress store.
//
// The redesign assumes five things the repo has never stored: which nodes are
// complete, which cards are known, a streak, XP, and hints left in a section.
// This is the smallest thing that makes them real. It is deliberately dumb —
// it records completed node ids and nothing about the curriculum, so every
// derived number (per-unit rings, per-section bars, known cards) is computed
// where the curriculum data already is. Swapping localStorage for an API
// later means reimplementing read/write and nothing else.
//
// Safe to import from a server component: every entry point degrades to the
// empty state when there is no window.

export const STORAGE_KEY = "lunadeck.progress.v1";

// Tuning knobs the design implies but does not specify. See docs/decisions/0005.
export const XP_PER_NODE = 3;
export const HINTS_PER_SECTION = 3;

export const EMPTY = Object.freeze({
  version: 1,
  completedNodeIds: Object.freeze([]),
  // Nodes missed on the first attempt. Drives the completion screen's
  // first-try count, and is what Spec_MainPath's mistake-review bridge will
  // read when it gets built.
  missedNodeIds: Object.freeze([]),
  streakDays: 0,
  lastPlayedDate: null,
  lastDrawDate: null,
  // The card drawn today, kept so a reload shows the same one rather than
  // rerolling, plus what has ever been drawn upright or reversed.
  draw: null,
  drawnCardKeys: Object.freeze([]),
  reversedCardKeys: Object.freeze([]),
  xp: 0,
  hintsBySection: Object.freeze({}),
});

// useSyncExternalStore compares snapshots by identity, so the parsed value is
// cached and only replaced when something actually writes.
let cache = null;
const listeners = new Set();

function hasStorage() {
  try {
    return typeof window !== "undefined" && !!window.localStorage;
  } catch {
    // Some browsers throw on property access alone when site data is blocked.
    return false;
  }
}

function parse(raw) {
  if (!raw) return EMPTY;
  try {
    const value = JSON.parse(raw);
    if (!value || value.version !== 1) return EMPTY;
    return {
      version: 1,
      completedNodeIds: Array.isArray(value.completedNodeIds)
        ? value.completedNodeIds
        : [],
      missedNodeIds: Array.isArray(value.missedNodeIds) ? value.missedNodeIds : [],
      draw: value.draw && value.draw.cardKey ? value.draw : null,
      drawnCardKeys: Array.isArray(value.drawnCardKeys) ? value.drawnCardKeys : [],
      reversedCardKeys: Array.isArray(value.reversedCardKeys)
        ? value.reversedCardKeys
        : [],
      streakDays: Number(value.streakDays) || 0,
      lastPlayedDate: value.lastPlayedDate ?? null,
      lastDrawDate: value.lastDrawDate ?? null,
      xp: Number(value.xp) || 0,
      hintsBySection:
        value.hintsBySection && typeof value.hintsBySection === "object"
          ? value.hintsBySection
          : {},
    };
  } catch {
    return EMPTY;
  }
}

export function read() {
  if (cache) return cache;
  if (!hasStorage()) return EMPTY;
  try {
    cache = parse(window.localStorage.getItem(STORAGE_KEY));
  } catch {
    cache = EMPTY;
  }
  return cache;
}

function write(next) {
  cache = next;
  if (hasStorage()) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Quota or blocked storage — the session still works, it just won't
      // survive a reload. Losing progress is better than losing the lesson.
    }
  }
  for (const listener of listeners) listener();
}

export function subscribe(listener) {
  listeners.add(listener);
  const onStorage = (event) => {
    if (event.key === STORAGE_KEY) {
      cache = null;
      listener();
    }
  };
  if (typeof window !== "undefined") window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    if (typeof window !== "undefined")
      window.removeEventListener("storage", onStorage);
  };
}

export function getSnapshot() {
  return read();
}

export function getServerSnapshot() {
  return EMPTY;
}

// --- dates -------------------------------------------------------------
// Device-local calendar day, per Spec_Meta_Hygiene_Systems Section 7.1.

export function today(now = new Date()) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

function daysBetween(from, to) {
  const a = new Date(`${from}T00:00:00`);
  const b = new Date(`${to}T00:00:00`);
  return Math.round((b - a) / 86400000);
}

// One increment per calendar day; a full missed day resets to 1.
function nextStreak(state, day) {
  if (state.lastPlayedDate === day) return state.streakDays;
  if (!state.lastPlayedDate) return 1;
  return daysBetween(state.lastPlayedDate, day) === 1 ? state.streakDays + 1 : 1;
}

// --- actions -----------------------------------------------------------

export function completeNode(nodeId, { day = today(), missed = false } = {}) {
  const state = read();
  if (state.completedNodeIds.includes(nodeId)) return state;
  const next = {
    ...state,
    completedNodeIds: [...state.completedNodeIds, nodeId],
    missedNodeIds:
      missed && !state.missedNodeIds.includes(nodeId)
        ? [...state.missedNodeIds, nodeId]
        : state.missedNodeIds,
    xp: state.xp + XP_PER_NODE,
    streakDays: nextStreak(state, day),
    lastPlayedDate: day,
  };
  write(next);
  return next;
}

// A section commits in one write, at the end of its run — including its review
// queue. Spec_MainPath Section 7.4 is explicit that a section is either fully
// completed or it didn't happen: leaving mid-lesson saves nothing, so there is
// no partial state to resume from and no half-finished section to reason about.
export function completeSection({
  nodeIds = [],
  missedNodeIds = [],
  hintsUsed = 0,
  sectionKey: key = null,
  day = today(),
} = {}) {
  const state = read();
  const done = new Set(state.completedNodeIds);
  const fresh = nodeIds.filter((id) => !done.has(id));

  const missed = new Set(state.missedNodeIds);
  for (const id of missedNodeIds) missed.add(id);

  const next = {
    ...state,
    completedNodeIds: [...state.completedNodeIds, ...fresh],
    missedNodeIds: [...missed],
    // Replaying a section you already finished shouldn't pay out twice.
    xp: state.xp + fresh.length * XP_PER_NODE,
    streakDays: fresh.length > 0 ? nextStreak(state, day) : state.streakDays,
    lastPlayedDate: fresh.length > 0 ? day : state.lastPlayedDate,
    hintsBySection:
      key && hintsUsed > 0
        ? {
            ...state.hintsBySection,
            [key]: Math.max(0, hintsLeft(state, key) - hintsUsed),
          }
        : state.hintsBySection,
  };
  write(next);
  return next;
}

export function spendHint(sectionKey) {
  const state = read();
  const left = hintsLeft(state, sectionKey);
  if (left <= 0) return state;
  const next = {
    ...state,
    hintsBySection: { ...state.hintsBySection, [sectionKey]: left - 1 },
  };
  write(next);
  return next;
}

// A draw is once per calendar day and is recorded the moment it is dealt, so
// closing the tab mid-reveal doesn't hand out a second card.
export function recordDraw({ cardKey, reversed = false, day = today() } = {}) {
  const state = read();
  if (!cardKey) return state;
  const add = (list, key) => (list.includes(key) ? list : [...list, key]);
  const next = {
    ...state,
    lastDrawDate: day,
    draw: { date: day, cardKey, reversed },
    drawnCardKeys: reversed ? state.drawnCardKeys : add(state.drawnCardKeys, cardKey),
    reversedCardKeys: reversed
      ? add(state.reversedCardKeys, cardKey)
      : state.reversedCardKeys,
  };
  write(next);
  return next;
}

export function drawnToday(state, day = today()) {
  return state.draw && state.draw.date === day ? state.draw : null;
}

export function reset() {
  write({
    ...EMPTY,
    completedNodeIds: [],
    missedNodeIds: [],
    drawnCardKeys: [],
    reversedCardKeys: [],
    draw: null,
    hintsBySection: {},
  });
}

// Dev-only: mark every node complete so the whole path is reachable for
// testing, without touching XP, streak or draw history — this unlocks
// navigation, it doesn't fake progress.
export function unlockAll(nodeIds = []) {
  const state = read();
  write({ ...state, completedNodeIds: [...new Set(nodeIds)] });
}

// --- selectors ---------------------------------------------------------

export function hintsLeft(state, sectionKey) {
  const stored = state.hintsBySection?.[sectionKey];
  return stored === undefined ? HINTS_PER_SECTION : stored;
}

export function isNodeComplete(state, nodeId) {
  return state.completedNodeIds.includes(nodeId);
}

export function wasMissed(state, nodeId) {
  return state.missedNodeIds.includes(nodeId);
}

// Nodes in this set answered right first time — what the completion screen
// reports as "7 of 7 first try".
export function countFirstTry(state, nodeIds) {
  const missed = new Set(state.missedNodeIds);
  const done = new Set(state.completedNodeIds);
  let n = 0;
  for (const id of nodeIds) if (done.has(id) && !missed.has(id)) n++;
  return n;
}

export function countComplete(state, nodeIds) {
  const done = new Set(state.completedNodeIds);
  let n = 0;
  for (const id of nodeIds) if (done.has(id)) n++;
  return n;
}

// A section counts as done only when every node in it is done — which is what
// makes its card "known" and what promotes the next section to current.
export function isSectionComplete(state, nodeIds) {
  return nodeIds.length > 0 && countComplete(state, nodeIds) === nodeIds.length;
}

export function sectionKey(unitNumber, section) {
  return `U${unitNumber}-S${section}`;
}
