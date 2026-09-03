# 0075 — Every tutorial caps at three showings, and the zone-round one shows two taps, not a drag

**Date:** 3 Sep 2026
**Status:** Accepted

## A tutorial demo is capped at three showings per mechanic, not tied to one round

`round.tutorial: true` used to be the whole story: whichever single round
in the curriculum data carries that flag plays its demo every time a
learner reaches it fresh (never on a second-look replay), forever. Since
that round is reachable more than once in the path (a shared section
across sibling units, e.g. Fool's own zone round teaches both units 1 and
4), the demo already resurfaced a few times - Simon's spec formalizes that
into an actual rule: a mechanic's tutorial (drag-a-keyword, drag-into-a-
blank, tap-then-tap-a-zone) should keep reappearing the first three times
it comes up anywhere in the path, then stop.

`lib/tutorial-gate.js`'s `consumeTutorialSlot(mechanicKey)` persists one
counter per mechanic in localStorage, incrementing (and returning
whether a slot was available) each time it's actually consumed. Counted
by encounter order, not literal unit number, so a path reorder (0074's
own reassignment included) doesn't require this to change.

`round-player.jsx`, `cloze-round-player.jsx`, and `zone-round-player.jsx`
each call it once, from a layout effect gated by a `tutorialSlotConsumed`
ref: `phase` now always *starts* `"live"` (matching what a server render,
with no localStorage, would show) and flips to `"demo"` before paint if
the mount both carries `round.tutorial` and earns a slot. The ref guard
exists because React Strict Mode's dev-only double-invoke of a mount
effect would otherwise burn two slots off one real visit -
`consumeTutorialSlot` does a real localStorage read-modify-write, unlike
the WAAPI `.animate()` calls elsewhere in these same files, where a
double-invoke is harmless (two identical animations on one node look like
one). `zone-chip-flight.jsx`'s own `spawnDust()` (0072) needed the exact
same guard for the same reason.

## Zone rounds' own tutorial shows two taps, not a slide

The zone-round tutorial went through three passes before landing. First
(0069): pulse a highlight box over the chip, then over the zone. Simon's
first note: with no finger at all, "it just flashes purple" - unclear
what it's even demonstrating. Second pass: a finger glides smoothly from
the chip to the zone. Simon's correction: that reads as demonstrating a
*drag*, the wrong gesture for a mechanic that's two independent taps.
Final: the finger appears at the chip, presses for 0.5s, disappears,
reappears at the zone, presses for 0.5s, disappears, and loops - no
motion between the two points at all, so there's nothing to misread as a
drag path.

The finger itself (`tutorial-tap.jsx` / `.tutorial-tap-finger`) is no
longer a plain circle - a tapered capsule shape, matching a real finger
silhouette, colour-matched to this app's own purple tutorial-affordance
accent (`--accent`) rather than tutorial-ghost.jsx's parchment tone
(gold/silver stays reserved for a correct-match reward elsewhere).
Anchored by its own tip, not its center, and fixed at a 135deg rotation -
Simon's spec: "always pointing up from bottom right to top left, to
emulate the user's own index finger on their right hand." Both this
finger and the pre-existing `tutorial-ghost-finger` (the one that rides on
top of a dragged keyword/blank-fill pill) share this same shape and angle
now, "same format for all tutorial steps."
