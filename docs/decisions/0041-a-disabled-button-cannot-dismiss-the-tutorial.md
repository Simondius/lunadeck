# 0041 — A disabled button cannot dismiss the tutorial

**Date:** 2026-08-31
**Status:** Accepted

## Context

Tia opened node 5 of v2's Fool section to test Simon's work and reported that
none of the options worked. They didn't. Nodes 1, 5 and 8 — every round with a
tutorial — could not be played at all.

## What was wrong

`TutorialGhost` demonstrates the drag on a loop and stops when a `pointerdown`
reaches `window`:

```js
window.addEventListener("pointerdown", interrupt);
```

There is no other exit. The loop is `onfinish` to `setTimeout(playOnce, 3000)`,
so it repeats forever until that listener fires.

Meanwhile all three round players disabled their chips for the duration:

```js
disabled={phase === "demo" || stage !== "playing"}
```

`DragChip`, `ZoneChip` and the cloze word chip are all real
`<button disabled>`. A disabled form control dispatches no pointer events at
all — not on itself, and nothing that bubbles. So pressing a chip produced no
event, `interrupt` never ran, `phase` stayed `"demo"`, and the chips stayed
disabled. Forever.

The only way out was to press something that wasn't a chip. The card worked.
So did blank space. Neither is what anyone presses, because the demo is a hand
dragging a chip, so the chip is exactly where attention goes.

`HINT` is gated on `phase !== "demo"` too, so that was dead as well.

Two things made it read as a frozen screen rather than a stuck tutorial. The
ghost's last keyframe is `opacity: 0` with `fill: "forwards"`, and the gap
between loops is 3000ms, so for three seconds in every seven the ghost is
invisible and there is nothing moving on screen at all. Tia's screenshot caught
exactly that moment: a static card, three chips, and no explanation.

## The fix

Drop the demo from the gate in all three players:

```js
disabled={stage !== "playing"}
```

A press on a chip now does both things at once. It reaches `window` and ends
the demo, and it starts the drag the user was trying to do. That is better than
making the first press a dismissal that consumes itself, which is what pressing
the card currently feels like.

Nothing is lost by letting a learner skip the demo. It was always dismissable
by any press; the gate did not enforce watching it, it only broke the one
gesture that mattered.

The requirement is recorded in `tutorial-ghost.jsx` next to the listener, since
that is where the coupling lives and the players are what have to satisfy it.

## Verified

With real browser input, not synthetic events — the distinction matters here,
because `dispatchEvent` on a disabled button *does* bubble and would have hidden
the bug entirely. An earlier synthetic test this session did exactly that: the
first drag failed, the second worked, and it looked like a quirk of my harness
rather than the round being broken.

Before: a real click on a chip left `chipsDisabled: [true, true, true]` and the
ghost still mounted. A real click on the card cleared all three.

After, on node 5: chips are enabled on a fresh load with the demo running, and
one real press-and-drag from the chip to the rising sun consumed the chip and
placed its badge. Node 1 (2 chips) and node 8 (6 chips) both load with the
tutorial running and nothing disabled.

## Note

Coordinates for real input are in the screenshot's frame, which is scaled when
the viewport is wider than the image — 800px of image for 865px of viewport
here. A first attempt at the drag missed by 9px for that reason and briefly
looked like the fix had failed. Convert, or click by `ref`.
