# 0070 — A round-player polish batch: pacing, sizing, and per-card affirmations

**Date:** 3 Sep 2026
**Status:** Accepted

A handful of independent playtest-driven tweaks, grouped here since none
was large enough for its own note.

## Choice rounds: a bigger correct, a dissolving wrong

`0066`'s tap-select rewrite gave the correct pick a plain glow-pulse and
faded the rest out at a flat opacity. Simon's follow-up: the correct pick
should also grow 10% (held there via `animation-fill-mode: forwards` until
the round advances on its own timer, so it doesn't snap back mid-glow),
and the others should read as dissolving, not just fading — a faster
300ms `blur()` + `brightness()` + slight scale-down ramp, not the previous
500ms flat opacity tween.

## A keyword round's leftover pops speed up

`round-player.jsx`'s `closeOutRound` pops each remaining wrong word in
sequence at one fixed `POP_MS`. Fine for one or two, but Simon's call
after watching a 6-word round close out: the third and fourth pop 30%
faster, and the fifth on pop 50% faster — `popDuration(index)` below the
loop, not a flat constant.

## A swipe round's single word fills the card, calibrated once

`swipe-round-player.jsx`'s phrase chip used one fixed 12.5px font-size for
everything — a single keyword ("speed") read as small and lost on a card
sized for a whole sentence. Simon's spec: a lone word should fill 80% of
the card's own vertical space.

First pass measured each word's *own* actual glyph bounding box
(`actualBoundingBoxAscent`/`Descent` off a scratch canvas — the display
serif's real ascent/descent runs well past a naive `font-size × line-height`
guess, which is what overflowed the card on the very first version) and
scaled straight to 80% height. That reads as inconsistent word-to-word: a
short word ("speed") has a small glyph box and so gets scaled *up* far more
than a long one ("exploration") ever could, landing at a wildly different
size. Simon's fix: calibrate the 80%-height ceiling once, off a fixed
string (`"Hpy"` — full ascent via the capital, full descent via `p`/`y`)
tall enough to cover any real keyword, and only shrink a *specific* word
below that ceiling if it's too wide to fit at that size. Every short word
now renders at the same size; only a genuinely long one shrinks from there.

## The node-complete celebration's affirmations are per-card

`0066`'s twenty "delightfully unhinged" affirmations were generic — none
mentioned which card the node just taught. Simon's call: they should be
contextually relevant and still unique. `node-complete-celebration.jsx`
now takes `cardKey` (threaded from `NodeSession`'s own top-level prop) and
picks from a per-card pool of twenty grounded in that card's own reading
notes (`data/data_card_talking_points.csv`) — the Fool's leap/precipice/
beginner's-mind, the Lovers' two-valid-paths/heart-over-head, the
Empress's abundance/nourish/self-love — the same notes the lesson content
itself teaches, played for a laugh instead of a fact. The original twenty
survive as `GENERIC_AFFIRMATIONS`, the fallback for a `cardKey` without its
own pool (a mashup node's own top-level `cardKey` is just whichever card
its first round happens to use, not necessarily what the whole node
covered).
