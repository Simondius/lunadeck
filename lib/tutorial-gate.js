// Whether a round's own once-per-mechanic tutorial demo should actually
// play this time - Simon's spec: a tutorial should keep reappearing the
// first few times its own mechanic (drag-a-keyword, drag-into-a-blank,
// tap-then-tap-a-zone...) comes up anywhere in the path, not just the
// very first, but stop once the learner has clearly had enough looks at
// it. Counted in the order the learner actually *encounters* each
// mechanic - whichever round with `round.tutorial: true` mounts first,
// second, third - not by literal unit number, so a path reorder (0073)
// changes which unit that lands on without this needing to change at all.
//
// Persisted in localStorage, one counter per mechanicKey, so it survives
// across sessions - "the first three times ever," not "the first three
// times today." Called from inside a layout effect (never during render,
// so no SSR/localStorage guard is needed here) by round-player.jsx,
// cloze-round-player.jsx, and zone-round-player.jsx, one call per mount,
// each with its own mechanicKey ("keyword"/"cloze"/"zone").
const MAX_SHOWS = 3;

export function consumeTutorialSlot(mechanicKey) {
  const storageKey = `lunadeck.tutorial.count.${mechanicKey}.v1`;
  try {
    const count = Number(window.localStorage.getItem(storageKey) ?? 0);
    if (count >= MAX_SHOWS) return false;
    window.localStorage.setItem(storageKey, String(count + 1));
    return true;
  } catch {
    // Blocked storage - default to showing rather than never.
    return true;
  }
}
