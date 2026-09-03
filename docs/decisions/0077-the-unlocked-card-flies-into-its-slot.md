# 0077 — The unit-celebration card persists across the route change and flies into its slot

**Date:** 3 Sep 2026
**Status:** Accepted

## Context

`0076`'s celebration screen and the deck's own unlock animation were two
independent flourishes either side of a route change - the card on the
celebration screen just vanished, and a moment later a *different* card
(the deck slot's own circular crop) reacted on `/deck`. Simon's spec: the
same card should visibly carry across - persist through the transition,
expand 20%, then fly into its slot while shrinking, snapping into place
once it lands. That means one continuous piece of DOM has to survive a
real Next.js route navigation, which normally unmounts everything the old
page rendered.

Also folded in from earlier playtesting: the card was cropped (the master
art isn't actually 5:7, `object-fit: cover` was cutting its sides off) and
read as static rather than a small ceremony, and the "ornate artifacts
with a key" were decorative filler rather than something worth learning
from - Simon's follow-up: use the card's own real keywords instead
(`data_card_keywords.csv`, the same source the keyword round-player format
itself teaches from), flashing in with a full second of sparkle each,
paced a random 0.2-0.6s apart.

## A raw DOM element survives what React can't

`lib/unit-unlock-flyer.js` names one constant, `FLYER_ID` - there's no
component here, just an id both sides agree on. `unit-complete-
celebration.jsx`'s own `complete()` clones the celebration card into a
plain `<img>`, appended straight to `document.body` (a sibling of Next's
own root container, not a child of it) at the card's exact current
screen rect, then grows it 20% via a WAAPI `left`/`top`/`width`/`height`
tween - not `transform: scale`, so the follow-up flight (a second tween
on the same four properties) has one kind of value to interpolate instead
of stacking a transform on top of a moving box. `router.push()` then
navigates to `/deck?unlock=...` - the App Router tears down and remounts
whatever *it* rendered, but this element was never part of that tree, so
it's untouched.

`deck-screen.jsx` looks for that same id by `document.getElementById`
once it mounts. Found: it measures the flyer's current rect and the real
target slot's own rect (`.slot`, the circular crop - not the whole
`.card-slot` link, which also carries the name label below it), instant-
scrolls the slot into view first (not smooth - the flyer is `position:
fixed` and doesn't track scrolling, so measuring its target has to happen
after the page settles, not mid-scroll), then flies it there: `border-
radius` sweeps from 12px to 50% over the same tween so it rounds into a
circle as it shrinks, landing exactly on the slot. On arrival the flyer
is removed and the real slot plays a quick "snap" (a fast overshoot-and-
settle scale pulse, `SNAP_MS`) plus the existing spark burst. Not found
(a direct or refreshed visit to the `?unlock=` link, with nothing handed
off) - falls back to the original `0076` behaviour of animating the slot
in place from scratch.

## The keywords, and their own sparkle

`unit-complete-celebration.jsx` now takes a `keywords` prop - `app/
story/play/[chapter]/page.js` fetches it server-side via a new `lib/
data.js` export, `getCardKeywords(cardKey)`, the same `data_card_
keywords.csv` index every other keyword-round already reads from. Each
one materialises as a pill styled like `round-player.jsx`'s own `.chip`
("like in the keywords session type," Simon's own words) at a random
0.2-0.6s gap from the last, but its own fade-in-and-sparkle
(`unit-celebration-keyword-in` plus a `::after` dust-burst pseudo-element)
always plays out over a full second regardless of that pacing - the two
numbers are independent, not the same knob. The card itself sizes off its
own natural aspect ratio now (`max-height`, no fixed box, no `object-fit:
cover`) so nothing is cropped, and wobbles (a slow rock, not a spin) under
a continuously twinkling glitter overlay rather than sitting still.
