# 0074 — Riley teaches Empress, Fool, Lovers instead of Fool, Lovers, Empress

**Date:** 3 Sep 2026
**Status:** Accepted

## Context

`0073`'s reorder (path order 1,3,5,2,4,6) fixed "no card taught twice in a
row" but broke character alternation - Dave's whole arc played before
Riley's started at all, since his units always held the lower number in
each pair. Simon's follow-up: keep strict Dave/Riley alternation *and*
avoid repeats. Both together are impossible while Dave and Riley teach
the same three cards in the same order (Fool, Lovers, Empress) - plain
numeric order (1,2,3,4,5,6) already alternates by construction (odd units
are always Dave, even always Riley), but it repeats every card
immediately (Fool,Fool,Lovers,Lovers,Empress,Empress), which is exactly
what 0073 was trying to fix. There's no interleaving of two identical
three-card sequences that's both alternating and repeat-free.

## The fix: reassign Riley's own card order

`UNITS`' array order goes back to plain 1-8 (0073's own reorder reverted -
alternation falls out of that for free). What changes instead is *which
card* each of Riley's three units teaches: Empress, then Fool, then Lovers
- not her original Fool, Lovers, Empress. Combined sequence: Fool(1),
Empress(2), Lovers(3), Fool(4), Empress(5), Lovers(6) - alternates, and no
two adjacent units ever teach the same card. Dave's three units (1/3/5)
keep their original cardSlug and content, completely untouched.

Mechanically this is just `data/v4/units.js`'s per-unit `cardSlug` for
units 2/4/6 changing from fool/lovers/empress to empress/fool/lovers -
same `startSlug`/`endSlug` filenames (`u2/u4/u6-riley-start/end.json`), no
routes or slugs renamed. `firstUnitForCard()` (0069's "Go Deeper into the
X" label logic, and the new "Add X to your deck" unlock CTA below) is
already computed dynamically from `UNITS` + `cardSlug`, so both correctly
follow the reassignment with no code change of their own - Empress' first
unit is now Riley's (unit 2), Fool's and Lovers' first units stay Dave's.

The actual dialogue inside those six chapter files had to be rewritten to
match - Riley's existing chapters assumed she meets Fool first, Lovers
second, Empress third, with her end-narrative recaps and 3-card synthesis
referencing that order by name. New content keeps her established voice
and continuing situation (tour, her old band, what's next) and follows the
exact structural shape her counterpart Dave's own equivalent units (1/3/5)
already establish for "a first card alone," "a second card alone then a
2-card recap," "a third card alone then a 3-card synthesis" - only the
prose and which card is being met changed, not the beat shape.

## Two small path-labelling fixes bundled in alongside this

- **Sequential unit numbers.** `/v4`'s own path banners now show `Unit
  {position in UNITS}+1`, not the stored `unit:` id - Simon's call: the
  learner should see 1-6-7-8 in order regardless of how the array itself
  is arranged internally. With 0073 reverted this happens to already match
  the stored ids again, but the display no longer *depends* on that
  matching, so a future reorder can't silently reintroduce the gap.
- **"Add X to your deck."** The end-narrative of the *first* unit to teach
  a given card now shows that as its own call to action (`app/story/play/
  [chapter]/page.js` computes `unlockCardName` via the same
  `firstUnitForCard`), rather than just the generic next-step label
  (usually the next unit's own "The Reading"). A second unit revisiting a
  card the learner already has doesn't get this - nothing new is being
  added to their deck there.
