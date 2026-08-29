# 0010 — Fixes from an adversarial review of the session's work

**Date:** 2026-08-29
**Status:** Accepted

## Context

Five pull requests went into `main` in one day, all merged without a human
reviewer. That is a lot of unreviewed code, so the whole of it was read back
adversarially before moving on to new features. These are the defects that
review found and this change fixes. The ones deliberately left are at the end.

## The worst of it: the Hint button did nothing

`session.jsx` stores the hint handler with `setHintHandler(() => handler)` —
the updater form, so state becomes `handler`. `format-a.jsx` passed
`() => hint`, a thunk. `hintHandler` therefore held `() => hint`, and calling
it returned the `hint` function without ever running it.

The wiring came in with the original lesson formats and was wrong from the
start, but it got worse here: the redesign added a visible `HINT · N` counter,
so the control went from silently doing nothing to visibly charging for
nothing. Fixed by passing `hint` rather than `() => hint`.

**And a second bug hiding behind the first.** `hint()` pushes into the same
`eliminated` array as a wrong guess, and a round reports `missed:
eliminated.length > 0`. So the moment the hint started working, taking one and
then answering correctly would have counted as a miss — queuing a round you got
right into the review, and permanently denting the first-try score. Hint
eliminations are now tracked separately and a round is missed only when
`eliminated.length > hinted.length`.

## The rest

- **An unanswerable round trapped the learner.** Nothing checked that a Format
  A round's `answerKey` was among its own candidates. If it weren't, every
  option would be eliminated in turn, the footer would disable with nothing
  selected, and the only way out would be quitting — which, since a section
  commits atomically, discards the whole attempt. `buildNode` now refuses such
  a round and the node falls through to the unplayable path. All 1081 instances
  currently pass, so this is a guard rather than a live fix.
- **Half of all 2-row boards gave themselves away.** Format C's right column is
  a plain Fisher–Yates shuffle with no identity rejection, so at two rows it
  came out in the same order as the left column half the time, and the board
  could be solved straight down without reading anything. It now re-seeds until
  the permutation isn't the identity.
- **A wrong pair on a board could cancel a later selection.** The 500ms reset
  timer was never stored or cleared, so an old round's timer would fire during a
  new one and blank the current selection — reading as a dropped tap. Held in a
  ref, cleared on the next wrong pair and on unmount.
- **Long-press to inspect closed itself on a mouse release.** The overlay opens
  under the cursor while the pointer is still down; touch has implicit pointer
  capture but mouse and pen do not, so `pointerup` hit-tested to the overlay
  and dismissed it instantly. This only mattered once desktop became a
  supported preview surface. The option now captures the pointer, so the
  release lands on the tile and closes the inspector deliberately.
- **The Draw tab's date could mismatch on hydration.** `toLocaleDateString`
  ran in the server's timezone during SSR and the browser's on hydration.
  Rendered after mount instead.
- **The Draw tab's preview pool could go empty.** The learner's current unit was
  read off the first unknown card in printed-deck order rather than the first
  unfinished section, so it jumped around. It now comes from the curriculum
  position, and `getAllSections` carries a unit number to make that possible.
- **A unit could never complete.** The path compared real completed nodes
  against `unit_metadata.total_node_count`. One stale cell there and the unit
  would never read as done, locking every unit after it — while the unit page,
  which counts honestly, showed it finished. Both now count real nodes.
- **Two dead ends.** A section with no steps rendered `null` — a blank page with
  no navigation, since the tab bar is suppressed during play. And the completion
  branch fell through when `completion` was absent, re-rendering the last step
  and looping the learner back through the bridge indefinitely. Both now render
  a screen with a way out.
- **An empty CSV threw** in `toObjects` rather than yielding no rows.
- **The session is keyed per section**, so the completion screen's link to the
  next section always gets a fresh state machine rather than depending on how
  the router treats a subtree whose only changed segment is a param.

## Kept

`scripts/check_rounds.mjs` — the harness that builds all 1081 round instances
and asserts each is playable — was living in a scratch directory and had
already drifted: it still checked A7's anchor for a `text` field that moved to
`category`/`name` two PRs ago, and reported four false failures. It is now in
the repo and runs as part of `npm test`, alongside `check_data.py` for the CSVs.

## Not fixed, deliberately

- **`missedNodeIds` is append-only.** Replaying a section and getting everything
  right still leaves the old misses on record, so a first-try score can never be
  repaired. Whether a miss should ever expire is a spaced-repetition question,
  and there is no spec for that yet.
- **The streak freezes once the curriculum is finished.** With every node banked,
  `completeSection` finds nothing fresh, so `lastPlayedDate` stops moving and
  the counter neither advances nor resets. It needs an answer to "what is a
  streak once there is nothing left to learn", which is an economy decision.
- **`completeNode` and `spendHint` are now dead in application code** — only
  `completeSection` is called. They are kept because the tests exercise them and
  a future per-node writer may want them, but they should be deleted if that
  never arrives.
