# 0007 — Deck and Draw, and what Spec_Daily_Draw_Tab doesn't get yet

**Date:** 2026-08-29
**Status:** Accepted

## Context

Two documents describe a card collection and they don't agree.

`Spec_Daily_Draw_Tab` designs a full collection game: a wall of 78 cards filled
in by drawing, a deck pile with a 12-hour configurable cooldown, a
three-phase progressive reveal (keywords one tap at a time, then description,
then reading points, with unlimited redo), reversed pulls on repeat cards, and
a completion goal of 156 states — 78 cards × 2 orientations.

The violet handoff designs something smaller. Its Deck tab is "see collection
completeness; reread a card you know", driven by `knownCardKeys` — the cards
the *curriculum* has taught. Its Daily Draw is one screen: tonight's card,
its keywords, a journal prompt and a streak row.

They also disagree about what "collected" means. In the draw spec you collect
by drawing; in the handoff you collect by finishing the section that teaches
the card.

## Decision

Build the handoff's version, because it is the current design pass and it
matches the app that exists.

**One definition of "known": the section that teaches a card is complete.**
The path's card counter, the unit page's card row and the Deck tab all call
the same `isSectionComplete`, so the three can never disagree. Drawing a card
does not make it known — a draw is a nightly ritual, not a shortcut past the
curriculum.

**The draw keeps the spec's pool weights**, because those are a real design
decision and the spec flags them as tunable: 70% taught-not-yet-drawn, 10%
preview from the next one or two units, 5% anything else undrawn, 15% a card
already drawn upright, pulled reversed. They live in one table in `lib/draw.js`
rather than scattered through the picker.

**Every draw is seeded by the calendar date.** Without that, reloading the tab
rerolls until you like the answer and the draw means nothing. It also means
today's card survives a refresh before it has been dealt.

**Cooldown is once per calendar day**, not the spec's configurable 12 hours.
It matches the streak's own day boundary and the design's "draw again after
sunset" copy, and there is no remote config to read a 12-hour value from yet.

## Consequences

Not built, and still specified in `Spec_Daily_Draw_Tab` for whoever picks it
up: the progressive reveal loop, the deck-pile cooldown countdown, the
"both sides done" gold ring on the wall, and replaying a collected card. The
reversed path here shows `reversed_reading_notes` on one screen rather than
the spec's own reveal sequence.

The completion screens report differently in their two variants. A section
reports first-attempt accuracy over its seven nodes. A unit recap is a single
node covering the whole unit, so "0 of 1 right first time" would be a nonsense
stat — it reports cards instead, as `Spec_MainPath` Section 6 already says it
should ("8/8 cards in this unit").

First-attempt misses are now recorded, which they weren't before. Nothing reads
them yet beyond the completion screen's accuracy line, but they are the input
the mistake-review bridge needs.
