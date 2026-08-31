// The Guide tab's live reading session.
//
// Its own localStorage key rather than a slice of lib/progress.js, because it
// is not progress. Nothing here is earned, nothing here counts toward a streak
// or a card unlock, and a reading someone did with their own deck should not be
// able to corrupt the record of what they have learned. Clearing one leaves the
// other alone, which is the behaviour you want in both directions.
//
// It persists at all because the cards are on a physical table. Losing a
// session to an accidental refresh would mean picking six cards up and scanning
// them again, which is the kind of thing that stops someone using a feature.

const STORAGE_KEY = "lunadeck.guide.v1";

export const EMPTY = null;

function canStore() {
  return typeof window !== "undefined" && !!window.localStorage;
}

// A stored session is untrusted input: it was written by an older version of
// this code, or hand-edited, or truncated by a browser clearing space. Every
// field is checked and anything unrecognised is dropped rather than passed on
// to a component that will index into it.
function parse(raw) {
  if (!raw) return EMPTY;
  try {
    const value = JSON.parse(raw);
    if (!value || value.version !== 1) return EMPTY;

    const cards = Array.isArray(value.cards)
      ? value.cards
          .filter((c) => c && typeof c.key === "string")
          .map((c) => ({
            key: c.key,
            name: typeof c.name === "string" ? c.name : c.key,
            master: typeof c.master === "string" ? c.master : null,
            reversed: !!c.reversed,
          }))
      : [];

    const reading =
      value.reading && typeof value.reading.takeaway === "string"
        ? {
            headline: String(value.reading.headline ?? ""),
            takeaway: String(value.reading.takeaway ?? ""),
            cards: Array.isArray(value.reading.cards)
              ? value.reading.cards.map((c) => ({
                  key: String(c?.key ?? ""),
                  name: String(c?.name ?? ""),
                  master: typeof c?.master === "string" ? c.master : null,
                  reversed: !!c?.reversed,
                  note: String(c?.note ?? ""),
                }))
              : [],
          }
        : null;

    const history = Array.isArray(value.history)
      ? value.history
          .filter((t) => t && typeof t.question === "string" && typeof t.answer === "string")
          .map((t) => ({ question: t.question, answer: t.answer }))
      : [];

    return {
      version: 1,
      startedAt: typeof value.startedAt === "string" ? value.startedAt : null,
      cards,
      reading,
      question: typeof value.question === "string" ? value.question : "",
      history,
    };
  } catch {
    return EMPTY;
  }
}

let cache = undefined;
const listeners = new Set();

export function read() {
  if (!canStore()) return EMPTY;
  if (cache === undefined) cache = parse(window.localStorage.getItem(STORAGE_KEY));
  return cache;
}

function write(session) {
  if (!canStore()) return;
  cache = session;
  try {
    if (session) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...session, version: 1 }));
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // A full or blocked store is not worth breaking the session over: the
    // reading still works for as long as the tab stays open.
  }
  listeners.forEach((listener) => listener());
}

// The useSyncExternalStore pair, same shape as lib/progress.js so the two read
// the same way from a component's point of view.
export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getSnapshot() {
  return read();
}

// Null on the server, which matches a first client render before localStorage
// has been read. Returning a fresh object here instead would make the two
// disagree and hydrate badly.
export function getServerSnapshot() {
  return EMPTY;
}

export function start({ now = new Date() } = {}) {
  write({
    version: 1,
    startedAt: now.toISOString(),
    cards: [],
    reading: null,
    question: "",
    history: [],
  });
}

export function end() {
  write(EMPTY);
}

// Adding a card invalidates any reading already given, because the reading was
// about a different set of cards. The session keeps the cards and drops the
// interpretation rather than leaving a stale one on screen next to a spread it
// no longer describes.
export function addCard({ key, name, master, reversed = false }) {
  const session = read();
  if (!session) return;
  if (session.cards.some((c) => c.key === key)) return;
  write({
    ...session,
    cards: [...session.cards, { key, name, master, reversed: !!reversed }],
    reading: null,
    history: [],
  });
}

export function removeCard(key) {
  const session = read();
  if (!session) return;
  write({
    ...session,
    cards: session.cards.filter((c) => c.key !== key),
    reading: null,
    history: [],
  });
}

export function setReversed(key, reversed) {
  const session = read();
  if (!session) return;
  write({
    ...session,
    cards: session.cards.map((c) => (c.key === key ? { ...c, reversed: !!reversed } : c)),
    reading: null,
    history: [],
  });
}

export function recordReading({ question = "", headline, takeaway, cards = [] }) {
  const session = read();
  if (!session) return;
  write({ ...session, question, reading: { headline, takeaway, cards }, history: [] });
}

export function recordAnswer({ question, answer }) {
  const session = read();
  if (!session) return;
  write({ ...session, history: [...session.history, { question, answer }] });
}
