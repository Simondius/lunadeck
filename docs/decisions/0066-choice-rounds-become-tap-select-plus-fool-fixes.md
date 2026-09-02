# 0066 — Choice rounds become tap-select, a node-complete celebration, and a Fool-unit content pass

**Date:** 2 Sep 2026
**Status:** Accepted

## Context

A single large playtest pass through the Fool unit specifically, plus a
few standing round-player fixes Simon asked to apply everywhere.

## Choice rounds: tap-select, not drag

`choice-round-player.jsx` used to reuse `DragChip` — the same drag-to-
the-card gesture every other v2/v3 round shares (`0035`'s own reasoning:
"switching mechanics for one round type breaks the rhythm"). Simon's
call, after playtesting Fool's own "The Full Picture" node: a multiple-
choice round reads more naturally as a tap, matching the language Story
mode's own narrative choices already use. The component is rewritten
around plain buttons:

- **Wrong tap**: shakes and tints red, then **stays** disabled — it
  doesn't reset and invite a retry, same rule chapter-player.jsx's own
  `eliminatedKeys` already follows (`0056`).
- **Correct tap**: sparkles for 500ms while every other option fades out
  over the same 500ms, then the round **advances on its own** — no
  Continue button, since there's nothing left to decide once the right
  answer is already picked.
- New classes (`.choice-select-option` and friends) rather than sharing
  `.story-choice-option` directly, so Story mode's own CSS and this
  round-player's can keep changing independently even though they read
  the same way today.

## Every round player was missing a leading spacer

`.drag-layout`'s content (the reference card, the sentence, the tile
grid) was pinned to the top of the screen — only the *trailing*
`.drag-layout-spacer` existed, which pushes the Continue button around in
the leftover space but does nothing to center the content above it. All
five round players (`round-player.jsx`, `zone-round-player.jsx`, `cloze-
round-player.jsx`, `tile-match-player.jsx`, and the rewritten `choice-
round-player.jsx`) now open with a matching leading spacer, so content is
genuinely centered top-to-bottom the same way the bridge/complete screens
already were.

## A recap cloze round doesn't get replayed on a miss

The whole-card recap round (every blank from a card's own description in
one sentence) used to queue for a second-look replay like any other round
if missed, per `node-session.jsx`'s own per-node mistake-review queue
(`0038`). Simon's call: a recap shouldn't be re-run — a fact just missed
deserves a second look, but a whole card's description doesn't. `cloze-
round-player.jsx` already computes `isRecap` (blank count over a
threshold) for layout purposes; it now also reports `noReview: isRecap`
via `onDone`, and `node-session.jsx`'s `handleRoundDone` skips queuing
the round for replay when that's set, regardless of `missed`.

## The node-complete screen gets a celebration

Replaces the old plain "Node N complete. / Placeholder ending —
see docs/draft-alt-path-fool-section.md." text with `node-complete-
celebration.jsx`: a small shooting star streaks in trailing a scatter of
glitter dust, then one of twenty "delightful, slightly unhinged"
affirmations (`AFFIRMATIONS`, picked at random per mount) fades in with a
brief glimmer where it lands, timed to start right as the star's own
900ms flight finishes rather than on its own separate clock.

## Fool unit content fixes

All in `data/v4/fool_section.json` (hand-edited directly — this file is
normally built by `scripts/build-v4-sections.mjs`, but these are one-off
authoring calls, not something to encode back into the generic build
script):

- The drag tutorial (the very first cloze round) now demos dragging
  **"journey"** into place, not "new cycle" — `cloze-round-player.jsx`'s
  own tutorial-word lookup changed to match.
- Node 2 ("Find the Elements"): its third zone round moved to the
  second-to-last position in the node; the second tile-match's Uranus
  pair now reads "Uranus: Sudden insight..." instead of leaving the
  symbol name off.
- Node 3 ("First Words")'s last two keyword rounds each gained two more
  filler words (2 correct/2 wrong → 2 correct/4 wrong) — going forward,
  **any keyword round positioned after a unit's "First Words" node should
  carry at least 6 total words**, not 4.
- Node 5 ("Closer Distractors"): its first three keyword rounds
  (4-words-each) collapsed into one round carrying all 4 correct words
  and all 5 filler words the three of them used between them.
- Node 6 ("All the Keywords"): its first two keyword rounds collapsed
  into one (4 correct, 6 filler), and its third and fourth collapsed into
  a second one (4 correct, 6 filler) — going forward, **several small
  keyword rounds testing overlapping words should condense into fewer,
  denser ones** rather than staying split.
- Node 7 ("The Full Picture")'s choice-round distractors were almost
  entirely copy-pasted from earlier swipe rounds' own non-match sentences
  (verified: 11 of 21 wrong options were exact or near-exact repeats) —
  all replaced with fresh ones. Going forward, **a distractor phrase
  shouldn't be reused within the same unit**, whatever round type it
  first appeared in.

The critical navigation bug this playtest also surfaced — a unit's last
lesson node skipping into the next card's own node 1 instead of that
unit's own end-narrative — is covered separately in `0065`, which this
work depends on (verifying the fixes above required first being able to
actually reach each of these nodes via the real path).
