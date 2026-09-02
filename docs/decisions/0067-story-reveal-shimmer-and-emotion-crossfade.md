# 0067 — Story mode: a reveal shimmer, and the character's expression crossfades

**Date:** 2 Sep 2026
**Status:** Accepted

## Reveal shimmer

A revealed card's entrance (pile to focus) still always plays out in full
and un-skippable, per `0056`'s own reasoning for why entrance and exit
can't share one skip listener. Simon asked for a flourish once it lands,
though — "shake and shimmer for 1s before the options appear, skip by
tap." `cardPhase` gained a new value, `"shimmering"`, sitting between
`"entering"` and `"shown"`: once the entrance animation's own `onfinish`
fires, the card plays a 1-second wobble-and-brightness-pulse
(`CARD_SHIMMER_MS`) via the same `animateSkippable` helper the exit
already uses, *then* becomes `"shown"` — the point at which the stage
actually becomes tappable and the next beat's choices can appear. Tap-
skippable "for free": `animateSkippable`'s shared `pointerdown` listener
already fires regardless of whether the stage has `tappable`'s `onClick`
attached yet, the same mechanism that already let the exit interrupt
early.

## The character's expression crossfades instead of popping

`chapter-player.jsx` swaps the character `<img>`'s `src` directly whenever
`emotion` changes (a beat's own emotion, or `reactionEmotion` after a
wrong choice) — previously an instant, un-transitioned swap. Simon's ask:
"when the character responds with an emoji, have it fade away for 1s
after the next user prompt appears." A new effect watches the resolved
`characterSrc(character, emotion)` value; whenever it changes, the
*previous* image is kept mounted as a `.is-fading-ghost` layer — z-index
above the live art, so it's what's actually visible at the moment of the
swap — animating its own opacity from 1 to 0 over 1 second while the new
expression, already rendered underneath, is revealed as it fades. This
covers both directions on a wrong choice: the reaction face (anger/
confusion) crossfades in immediately, and when it reverts to neutral
after the existing 900ms window, that reversion crossfades too, rather
than either swap popping instantly. Verified by sampling the DOM directly
(a screenshot can't reliably catch a sub-second transition) — both
crossfades measured as a clean, continuous 1-second opacity ramp.
