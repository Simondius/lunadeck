# 0071 — Story mode's "Tap to continue" waits for a pause, not a tap count

**Date:** 3 Sep 2026
**Status:** Accepted

## Context

`chapter-player.jsx`'s "Tap to continue" hint used to be a one-time
onboarding mechanic: shown instantly the moment a step became tappable,
persisted (via `localStorage`) across chapters, and permanently dismissed
once the reader had made a handful of real taps anywhere. Fine for the
routine dialogue-advance tap, which a reader learns almost immediately —
but it meant a returning reader got *zero* affordance on a card reveal
specifically, a much rarer moment (once per chapter beat, not constantly),
right when there's the least other UI on screen to suggest what to do.

## The new behaviour

Simon's spec: any step that's waiting on the reader — a card sitting
revealed with no button, a dialogue line, an elaboration bubble — fades
the hint in after a second of inactivity, and fades it back out the
instant the reader acts. No more permanent dismissal, no more
`localStorage` count; `TAP_HINT_KEY`/`TAP_HINT_THRESHOLD`/`tapHintDismissed`/
`recordRealTap` are gone.

One effect drives it, keyed on `[tappable, beatIndex, cardPhase,
elaborationStep]` — `tappable` alone isn't enough, since it can stay `true`
across two different dialogue beats in a row; the other three are what
actually mean "this is a new thing to wait on," and any one changing
restarts the timer. Whatever ends the wait — the tap that answers it, or
`tappable` going false outright (a choice beat's own buttons, the chapter
ending) — reruns this same effect, which is what drops `tapHintVisible`
back to `false` and, via `.story-tap-hint`'s own CSS transition, is what
lets the hint fade back out instead of just vanishing.

Fade timings are deliberately asymmetric (Simon's own numbers): 1000ms
before it appears, then a full 1000ms fade *in* (`.story-tap-hint.is-visible`'s
own `transition`) since it's a passive, ambient nudge — but a quick 200ms
fade *out* (the base rule's `transition`), since that one's a direct
response to the reader having just acted and shouldn't linger.

## Follow-up: moved below the stage

The hint's own position used to be inside `.story-stage` itself
(`position: absolute`, bottom-right corner) — which put it exactly where
a speech bubble could also land, and did. It's now a plain flex child of
`.story-content`, right below the stage image, centred — every beat this
can show for already renders nothing else in `.story-content-main` (see
`tappable`'s own conditions vs. the `atEnd`/`choice`/`draw` branches
there), so there's nothing for it to compete with in its new spot either.

