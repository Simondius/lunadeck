# 0039 — Two fixes from reviewing v2

**Date:** 2026-08-31
**Status:** Accepted

## Context

Tia asked for v2 (#54) to be read through properly. Neither she nor Simon
reads code, so review, fixes and approval sit here now rather than with them.

The work itself is sound. `0037`'s central claim holds under checking: there is
no import of `lib/progress` anywhere in `components/lesson-v2`, `app/v2` or
`lib/dev-console-bridge.js`, so v2 genuinely cannot corrupt v1 progress. All
five section files name real cards from `data_tarot_cards_base.csv`. The real
curriculum CSVs were not touched — v2's data lives in `data/v2/` as JSON. All
49 node URLs render without error, tests pass, `check_rounds` is clean, and the
hand-reconciliation of `app/globals.css`, `components/tabbar.jsx` and
`components/dev-console.jsx` against #52/#53 lost nothing.

Two defects, both found by checking rather than reading.

## A broken tile image

`data/v2/fool_section.json` pointed node 5's tilematch round at
`major_00_fool_element_cliff.png`. The asset is
`major_00_fool_element_cliff_edge.png`.

`0035` records that the `image` field was derived from each element's `key`,
and five of Fool's six keys happen to match their filename exactly. `cliff`
does not — the file is `cliff_edge`. A mechanical key-to-filename mapping
would produce this one error and no others, which is exactly what happened.

**Fixed by correcting the reference, not renaming the asset.** `cliff_edge` is
the more descriptive filename, and the element `key` of `cliff` is used by the
zone round in the same file — renaming the key to match would have broken that.

It failed silently: `tile-match-player.jsx` renders `<img src={pair.image}
alt="" />` with no error handling, so the tile was simply blank. A learner
would have had to match an empty square.

## Skip controls off the edge of the frame

The `‹ ›` buttons `0036` added are `position: absolute` against
`.dev-console`, at `right: 100%` and `left: 100%` plus an 8px margin — 48px
outside the FAB on each side. `clamp()` (mine, from #52) keeps *the console*
inside the frame but knew nothing about anything attached to it, so at either
edge one button landed outside. Measured with the console parked at `x: 0`: the
previous button sat at `left: -48`, entirely off the frame and untappable.

Neither piece is wrong alone. The bug is in the seam, which is where two people
working in the same file on the same day tend to leave one.

**`clamp()` now takes a `wings` argument** — the room needed either side of the
FAB for whatever is attached to it, `SKIP_WING = 48` when the skip controls are
showing and zero when they are not. The drag handler passes it, and an effect
re-clamps when the controls appear, since a node session can mount long after
the console was parked. That effect returns the same object when nothing moves,
so React bails rather than looping.

Verified at both edges: parked at `x: 0` the console re-clamps to 48 and the
previous button lands at `left: 0`; parked hard right it clamps to 271 with the
next button ending at 371 inside a 375 frame. Both tappable in both cases.

## Consequences

**One thing left for Simon rather than fixed here.** The tilematch round is
match-an-image-to-a-description, and the images carry `alt=""`. That is correct
for decoration and wrong here, where the image *is* the content — a screen
reader user cannot play the round at all. Giving the image its element text as
`alt` would make it playable and also hand over the answer, so it is a design
question about who the round is for, not a defect to quietly patch.

**`0037` names two things that no longer exist.**
`components/lesson-v2/fool-drag-section.jsx` and its `FoolDragSection`
component were replaced by `round-player.jsx` / `node-session.jsx` during the
overnight build in `0035`. A comment in `collected-badge.jsx` still refers to
`FoolDragSection` too. Left alone: `0037` is an accepted record of a decision
taken at the time, and rewriting history to match later code is worse than a
dated document. Worth a line in `0037` if Simon wants one — his file, his call.
