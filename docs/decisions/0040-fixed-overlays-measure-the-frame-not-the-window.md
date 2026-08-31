# 0040 — Fixed overlays measure the frame, not the window

**Date:** 2026-08-31
**Status:** Accepted

## Context

`0039` fixed two defects found on a first read of v2 (#54) and said an
unreviewed overnight build that yields two on a first look usually has more.
This is the second pass, aimed deliberately at the bug classes this repo has
already produced rather than at the code in general.

One of those classes hit. All three of v2's drag overlays were positioned wrong
above 900px.

## What was wrong

`zone-highlight.jsx`, `collected-badge.jsx` and `tutorial-ghost.jsx` each
measure a target with `getBoundingClientRect` and assign the result to a
`position: fixed` element:

```js
el.style.left = `${cardRect.left + rect.x0 * cardRect.width}px`;
```

Those are two different coordinate spaces. `getBoundingClientRect` returns
viewport coordinates. `left` on a fixed element is measured from its containing
block, which is the viewport only when no ancestor establishes one — and
`.app-frame` establishes one at desktop widths, via `transform: translateZ(0)`
in the 900px block of `app/globals.css`.

Measured at a 1150px window: the frame sits at (361, 30), and a coordinate
intended for viewport x=400 landed at x=761. Every overlay was out by the
frame's own offset. Since the frame is only 428px wide, that usually put the
overlay off the edge. The tutorial ghost — the hand that shows a first-time
learner the gesture, and the only reason a tutorial round exists — rendered at
x=806 while the chip it was demonstrating sat at x=445, with the frame ending
at 789. It was off screen.

## Why review didn't catch it

Below 900px `.app-frame` is untransformed and flush to the corner, so the frame
offset is (0, 0) and the arithmetic is accidentally correct. The app is a phone
prototype; every deliberate check happens at phone width. The bug is invisible
at the size the thing is designed for and appears only in the desktop preview,
which is exactly where Tia looks at it.

This is the fourth instance. The dev console twice (`0032`, `0033`), the reveal
overlay (`0030`), now these three. Two of those took two attempts because the
first diagnosis was wrong.

## The fix

`lib/fixed-position.js`, and `placeFixed(el, rect)` at the three call sites.

The deltas in all three animations were already correct and are untouched — a
`translate(dx, dy)` is space-independent. Only the origin was wrong, so each
call site is one line.

`fixedOrigin` walks the ancestors asking whether any establishes a containing
block, rather than special-casing `.app-frame`. The frame is today's answer; a
`filter`, `backdrop-filter`, `contain` or `will-change: transform` on some
future wrapper would be tomorrow's, and each of those creates one too. Given
this is the fourth time, the general question is worth asking. With no such
ancestor it returns `(0, 0)` and subtracts nothing, so the phone path is
arithmetically unchanged rather than merely tested.

## Verified

Measured, not eyeballed — a screenshot of an overlay that is 361px off the
right edge of the frame looks the same as one that was never mounted.

At 1150px, after the fix: the tutorial ghost sits at (445, 452), its chip's
exact position. A correct drop places `.zone-highlight` at `left: 238.9px`
against 239px expected; before the fix it computed 600px, which in a 428px
frame is past the right edge. The badge and its trail land frame-relative too.

At 375px: `.app-frame`'s transform is `none`, no ancestor qualifies, the origin
is `(0, 0)`, and the ghost still sits exactly on its chip.

`npm test` passes 43 tests, `check_rounds` reports every round playable, and
`next build` prerenders all 49 v2 node routes.

## Not done

`dev-console.jsx` keeps its own `frameBox()`. It needs the frame's *size* with a
window fallback, which is a different question from converting an origin, and it
has been fixed twice already. Sharing code between them would be tidier and
riskier.
