# 0055 — Story mode: the Past/Present/Future slots move onto the table

**Date:** 2 Sep 2026
**Status:** Accepted

## Context

The first pass at multi-card slots (`0054`) rendered `.story-slots` as a
row between the stage and the choice panel below it — Simon's own review
called this out as crowding into the text box's own space, and separately
asked for the slot cards themselves to be 25% bigger.

`.story-slots` moved inside `.story-stage` itself, positioned to sit on
`.story-table-art`'s own drawn surface rather than guessing at
coordinates: the table's rendered bounds (after its own `rotateX` tilt)
were measured directly off the DOM at roughly `top: 62%` / `height: 38%`
of the stage, and the slots row was placed inside that band. Climbing any
higher puts it back in the character/background layers above the table's
own back edge, which is the exact overlap Simon flagged.

Each slot is now sized as a percentage of stage *width* for both
dimensions (`aspect-ratio` derives height from that), 23% each — up from
the roughly 19% the row previously used — so the row scales with the
stage the same way every other layer already does, instead of carrying a
fixed pixel size. Labels changed from `var(--muted)` text to solid
parchment text on an opaque dark pill, for the same reason the tap-hint
and caption already use one: a translucent/muted treatment can't
guarantee contrast against whatever linework happens to sit behind a
given slot.
