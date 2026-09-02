# 0054 — Story mode: "Part N" labels, and a slot mechanic for multi-card readings

**Date:** 2 Sep 2026
**Status:** Accepted

## Context

Story mode grew from one chapter to four in this pass: two single-card
readings (Dave and Riley each drawing the Fool) and two three-card
past/present/future readings (adding the Lovers and the Empress, in a
different draw order per character). Two mechanics needed to exist to
support that, neither of which the original single-chapter build needed.

**"Dave Part 1", "Riley Part 1", "Dave Part 2"...** `data/story/
chapters.js` computes this label with a running counter keyed on
`chapter.data.character`, read in array order — not stored on the chapter
data itself, so it can't drift out of sync with the chapters' actual
position in `CHAPTERS`. Order in that array is what decides which part
number a chapter gets, and so also what order the two characters'
chapters interleave in (Dave 1, Riley 1, Dave 2, Riley 2), matching how a
learner should actually encounter them.

**A `slot` field on `reveal` beats.** A three-card reading needs its own
card to land in a specific labelled position (Past/Present/Future) rather
than settling beside the pile the way a single-card reveal does. Adding
`"slot": <index>` to a reveal beat records that card into
`chapter.slotLabels[index]` on dismiss instead. Draw order and visual slot
position are deliberately decoupled: a beat's `slot` says which labelled
position the card belongs in, not which order it's revealed in, which is
what lets Dave draw Present→Future→Past while Riley draws
Past→Present→Future and both land on the same three-slot layout.
