# 0069 — Zone rounds become tap-then-tap, not drag

**Date:** 3 Sep 2026
**Status:** Accepted

## Context

`zone-round-player.jsx` ("Find the Elements") was the last drag-based round
left after `0066` moved choice rounds to tap-select — drag a description
phrase onto the part of the card it describes. Simon's call, playtesting
it again: dragging a whole sentence onto a specific patch of card art read
as unnatural. The replacement: tap the description, tap the part of the
card it belongs to, in either order.

## The interaction model

One selection at a time, of either kind (`{ type: "button" | "zone", key }`
or `null`), read straight off render-time state rather than a
`setSelection` functional updater — the match/mismatch handlers each fire
several `setState` calls of their own, which a Strict Mode dev build would
double-invoke if they lived inside an updater (React does this on purpose,
to catch exactly this kind of impurity). A plain tap handler closing over
the latest render's state has no such rule and needed no workaround.

- Nothing selected, tap either kind: it becomes the selection, and the
  matching button or zone shimmers gold-and-silver (looped CSS, not the
  one-shot WAAPI burst - it has to hold indefinitely, however long the
  learner takes to make the second tap).
- Tap a second thing of the *same* kind: focus shifts to it. Tap the exact
  same selection again, or an undefined patch of the card: it deselects.
- Tap a thing of the *other* kind while something's selected: a match
  attempt. Same element on both sides - correct; different - wrong.

Every element's own rect(s) on the card now render as real tappable
buttons (`.zone-tap-area`, invisible until selected — the puzzle is still
finding the right patch of art, `HINT` still un-blanks it on request), not
just an invisible drop target measured during a drag gesture.

## Correct match: fly, burst, colourize

Simon's spec: "the button flies into the tap zone... the card is
disintegrating into glitter and being absorbed into the card and
colourizing it." Three pieces, sequenced by one `FLIGHT_MS` (480ms) delay
rather than chained promises, matching this file's existing style
elsewhere (`WRONG_FLASH_MS`, `CONTINUE_FADE_MS`):

1. `zone-chip-flight.jsx` — the tapped button's own last on-screen rect
   (measured via `getBoundingClientRect()` in the same synchronous tap
   handler that removes it from `remaining`, since the real button is gone
   by the time a mounted component could measure it itself) flies into the
   zone's rect, shrinking and fading as it travels.
2. `zone-highlight.jsx` — retimed from "hold then shrink to centre" (the
   old drag-drop reward) to "impact then disperse outward," mounted the
   instant the flight above would land.
3. The permanent colour `revealed` crop now fades in (`zone-reveal-in`,
   550ms) instead of popping instantly, landing alongside the burst.

A correct match removes the element from `remaining` immediately - the
button vanishes from the chip row and the row reflows on its own via
ordinary flex layout (no FLIP animation for the gap closing; not worth the
complexity for a chip list this short) - while the flight ghost, holding
the button's last measured position, covers the transition visually.

## Wrong match

Both sides flash red (reusing `choice-option-shake`/`zone-area-wrong-flash`)
for `WRONG_FLASH_MS` (500ms, Simon's own number), then both are free to
try again - no permanent elimination, unlike a wrong tap in a choice round.

## The tutorial

`tutorial-ghost.jsx`'s dragged pill had a physical path to trace; there's
no path here, so `tutorial-tap.jsx` instead pulses a soft highlight over
the demo chip, pauses, pulses the same highlight over the zone it matches,
and loops - the tap equivalent of the same brief. Same interrupt rule
`0041` established: the real chip and zone stay tappable underneath the
whole time, so a tap on the very thing being demoed both ends the demo and
(once the parent flips `phase` to `"live"`) answers for real, since both a
global `pointerdown` listener and the target's own `onClick` fire off the
one physical event.
