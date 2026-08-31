# 0033 — The greeting sits under its header, not in the middle of the screen

**Date:** 2026-08-30
**Status:** Accepted

## Context

Tia, on the greeting: *"this page looks off. The gap between the image and the
top of the screen is too large."*

Measured at her viewport shape rather than the preview pane's, which is what
made it visible: at 375x812 the gaps were 32px above and 21px below and the
screen looked fine. At **375x1242** the same CSS gave **247px above and 236
below**, with the card still 262x470.

The cause is a fixed-size block centred in a growing box. The card was capped
at 470px tall, the block's min-height grew with the viewport, and every extra
pixel of screen became margin split evenly top and bottom.

Worth naming as a class of bug: **anything centred in `100dvh` looks correct at
the height it was tuned at and wrong at every other one.** The preview pane is
812 tall; a desktop browser is not.

## Decision

**One box, declared once.** `--greet-box` on `.reader-greeting` is the free
region under the status bar and rule, and the card is sized from it. Two rules
reading the same variable rather than two guesses that have to agree.

**The card is sized from width, with the height budget converted through the
ratio:** `width: min(100%, calc((var(--greet-box) - var(--below)) * 813 / 1456))`.
Whichever runs out first decides, and the other follows from `aspect-ratio`.

An earlier cut set `height` directly and capped `max-width`. That let the width
clamp while the height stayed put, which pushed the frame off-ratio and cropped
the sides of a printed cover — 305x620 against a 0.559 source. Verified now by
comparing the frame's ratio to the image's own rather than by looking.

**The group sits under a bounded gap instead of being centred.**
`justify-content: flex-start` with `padding-top: clamp(12px, 4dvh, 56px)`. The
column is narrow and tall on a desktop frame and the card's width is capped by
the column, so it cannot grow to fill that height; centring split the surplus
and put the larger half in the worst place, between the header and the hero.

## Consequences

**Measured across three shapes**, ratio holding and nothing scrolling in any:

| viewport | card | gap above | below the button |
| --- | --- | --- | --- |
| 320x720 | 199x356 | 42 | 24 |
| 375x812 | 250x448 | 54 | 20 |
| 375x1242 | 331x593 | **72** | 288 |

Against 247 above at 1242 before.

**The surplus does not disappear on a tall screen, it moves.** 288px sits
between the button and the tab bar at 1242. A 0.559 card in a 331px column
cannot be taller than 593px, so on a 1074px free region something has to give.
Below the content it reads as margin; above it read as a hole. That is the
whole of the improvement and it is worth being honest that it is a
redistribution rather than a fix.

If it still reads as empty, the next lever is content rather than layout: the
screen has one image, one line and one button, and no amount of spacing makes
three things fill a tall column.

## Amendment, same day: 100dvh is not the screen on a desktop

Tia: *"i shouldn't have to scroll to get to the draw button though."*

Everything above was measured at 375px wide, and the desktop framing only
applies **at 900px and up**. Her browser is 1150 wide, so the app is drawn as a
device and `.app-frame` caps itself at `min(940px, 94dvh)`. On a 1242-tall
window that is **940px**, while `--greet-box` was computing against
`100dvh` = 1242. The card was sized for 300px of room that does not exist, and
the button fell past the bottom of the frame.

The codebase already knew: a note beside `.app-scroll` says *"100dvh is the
window, not the frame, so full-height screens would overflow it"*, and
`.session` and `.complete` are patched individually for it. Three more screens
built this session repeated the mistake.

**So it is a token now, not a patch.** `--frame-h` is `100dvh` at `:root` and
`min(940px, 94dvh)` on `.app-frame` inside the desktop media query, and
anything sizing itself to "the whole screen" reads that instead. The greeting
box, the greeting's top padding, the mentor portrait cap, the waiting screen
and the reveal overlay were all converted.

Measured at 1150x1242, desktop framing active: frame 428x940, card 322x576,
ratio held, button clears the tab bar by 15px, nothing scrolls. The reveal
covers the frame exactly at 428x940 rather than overshooting to 1242, and the
waiting screen fits at 840. At 375x812 nothing changed.

**The lesson is narrower than "test other viewports".** The pane I had been
measuring in all session is 561px wide, under the breakpoint, so desktop
framing was never active and this class of bug was invisible there no matter
how many heights I tried. Checking a second *height* would not have found it;
only a second *width* would.

**`--below: 196px`** is the measured height of everything under the card — 26
margin, up to three lines at 24.75, 28 margin, 51 button — with headroom. It is
a magic number and it will be wrong if that copy grows. The clearances above
are the check: they were 4px and 8px at 180px, which is too close to trust.
