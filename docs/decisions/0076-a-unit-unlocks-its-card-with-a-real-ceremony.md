# 0076 — A unit's own end-narrative unlocks its card with a real ceremony

**Date:** 3 Sep 2026
**Status:** Accepted

## Context

The end-narrative of the first unit to teach a given card used to just say
"Add X to your deck" on a plain button that jumped straight into the next
unit's own start narrative — no acknowledgement that anything had actually
happened. Simon's spec: a genuine hand-off ceremony, spanning two screens
(one full of its own flourish, one landing on the real place the card now
lives) rather than a label change on the same old button.

## Screen one: `unit-complete-celebration.jsx`

Takes over the whole screen instead of nesting in `chapter-player.jsx`'s
own stage/content layout, the same way `node-session.jsx`'s "complete"
stage is its own `<main>` rather than a variant of the round-playing one -
a genuinely different screen, not a state of the narrative reader.

The unit's own card sits large, glimmering (`.unit-celebration-glimmer`,
a looping brightness pulse), while five ornate key artifacts (a plain
inline SVG - no key asset exists in `assets/`, and this is decorative
chrome around the ceremony, not card content, so it isn't subject to
CLAUDE.md's "don't invent card content") materialise around it at random
0.2-0.6s intervals. A tap resolves whichever wait is currently pending
immediately (the same `skipResolverRef`-over-a-`Promise` pattern this
codebase already uses throughout for skippable animations - tutorial-
tap.jsx, round-player.jsx's own `animateSkippable`) rather than skipping
the whole sequence outright, so a tap always advances by exactly one
artifact. Once all five have appeared, a "Complete Unit N" button (N is
the unit's own *position* in `UNITS`, matching `app/v4/page.js`'s own
sequential display) becomes available.

## The hand-off, and why it's a query string

Tapping through navigates to `/deck?unlock=<cardKey>&next=<nextHref>`.
There's no shared client store connecting Story mode's own component tree
to the Deck tab's - they're different routes, and this is a one-shot
piece of state that only matters for the one navigation that carries it,
so a query string is the simplest thing that actually works. `deck-
screen.jsx` reads it, plays the animation, then clears it via
`window.history.replaceState` (not `router.replace()` - see the bug
below) so a refresh doesn't replay any of this.

## Screen two: the deck slot's own reaction

`lunadeck.deck.celebrated.v1` (localStorage) tracks which cards have
already played this animation once - separate from `lib/progress.js`'s
own `knownCardKeys` (which only tracks whether the lesson content is
actually done, never resets, and says nothing about whether the *reveal*
has been watched). A card missing from that set gets the "satisfying
lock" animation Simon described (shrink, a quick 0.2s over-expand, shrink
back into the slot); one already in it gets a level-up shimmer (a
brightness/scale pulse) instead. Either way, `deck-screen.jsx`'s
`spawnSlotSparks()` lifts a burst of gold/silver dust off the slot's own
edge - the same technique `swipe-round-player.jsx`'s `spawnBurst()` and
`zone-chip-flight.jsx`'s `spawnDust()` already establish, just called once
here instead of per-animation-frame.

Once the slot's own animation finishes, a translucent arrow appears
pointing down at the Path tab (measured off `.tabbar .tab`'s own real DOM
position, then clamped so its wider "Continue Story" pill can't run off
the left edge of the screen when the tab it's pointing at sits close to
it) with that exact call to action. Tapping the pill navigates onward;
tapping anywhere else on the backdrop dismisses the whole arrow without
navigating - Simon's spec for both.

## Two real bugs, both variations on the same one

**`router.replace()` cancelled the animation it was meant to clean up
after.** The first pass called `router.replace("/deck")` to strip the
`?unlock=` query string immediately. That triggers a real Next.js route
re-render, which tore down the effect's own in-flight `setTimeout` (the
500ms delay before the slot animation starts) via its cleanup function
before it ever fired - the celebrated-set update ran (it's synchronous,
earlier in the same effect), but nothing after the delay ever did.
Switched to `window.history.replaceState()`, which edits the address bar
without touching React at all.

**The same cleanup, once removed, exposed the guard's actual job.** With
`router.replace()` gone, the timeout still didn't fire reliably until the
effect's own `return () => window.clearTimeout(startTimeout)` was deleted
outright - a React Strict Mode dev double-invoke calls a real cleanup
*between* its two passes of a mount effect, which cleared the first
pass's timeout, and since `celebrationHandled.current` (already `true`
from the first pass) then blocks the second pass from scheduling a
replacement, nothing was left running at all. `celebrationHandled` is
enough on its own to guarantee "this animation plays exactly once" -
returning a cleanup on top of it was actively harmful here, unlike the
`useRef` guards elsewhere in this codebase (`0072`, `0075`) that protect a
single side-effecting *call* inside an effect that otherwise has nothing
worth cleaning up.

Also required a `<Suspense>` boundary around `DeckScreen` in `app/deck/
page.js` - `useSearchParams()` needs one wherever the route could be
statically prerendered, or `next build` fails outright. Caught by running
a real production build, not just the dev server, which doesn't enforce
this the same way.
