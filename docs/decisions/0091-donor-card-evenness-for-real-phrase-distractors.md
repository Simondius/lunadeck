# 0091: Real-phrase distractors stop leaning on the same handful of donor cards

## The problem

Simon: the Fool's own phrases show up constantly as wrong answers on other
cards - "same process" as `0088`'s silly-word repeat caps, but for the real
reading-note phrases `otherCardNotes()` borrows from other majors for
choice-round options and swipe-round false cards.

An audit (walking every choice/swipe round's non-correct text back to its
source card via `data_card_talking_points.csv`) confirmed it precisely:
204 of the course's distractor slots are real-phrase (the rest are
`SILLY_SENTENCES`, out of scope here), and among them Fool backed 35,
Empress 31, High Priestess 28, Magician 21, Hierophant 16 - while Chariot
backed 3 and several majors barely appeared. Root cause: `otherCardNotes()`
always walked `similarityByCard`'s ascending-score list from the top, so
the handful of majors that rank as "most confusable" for many *other*
cards get picked over and over, with no notion that they'd already been
used elsewhere in the course.

## The fix

Same shape as `drawSillyWords` (`0088`): a module-level usage cap, checked
before drawing, that skips past an over-used donor to the next-closest
match instead of always taking the top of the list.

`otherCardNotes()` in `scripts/build-v4-new-cards.mjs` now tracks
`donorGlobalUsage` (cap 10, across all 17 cards this script builds) and
`donorPerCardUsage` (cap 2, within one consuming card's own capstone/
node-5/node-6 slots) and skips any donor at either cap, continuing down
the same similarity-ordered list rather than falling back to something
less confusable arbitrarily.

The five hand-authored cards (Fool, Lovers, Empress, Magician, Emperor)
predate this generator and aren't rebuilt by it, so - same as `0088`'s
silly-word fix - a one-off script (`rebalance_donor_cards.py`) rebalances
the real-phrase slots across all 22 cards' baked JSON together, replacing
over-cap donor phrases with a phrase from the least-used compliant donor
(preferring the consuming card's own closest-similarity list first, same
spirit as the generator's own ordering) while never introducing a
duplicate phrase within one card's own file.

## Sequencing

Fixed the generator first, reran it (`node scripts/build-v4-new-cards.mjs`)
so the 17 generator cards' own node-4/5/6/capstone content is rebuilt
under the new per-run cap, confirmed `existingNode2()` (`0088`) still held
node-2 untouched, then ran `rebalance_donor_cards.py` against the full
resulting 22-card state to true up anything the generator's own
17-card-only view couldn't see (the 5 static hand-authored files).

## Verification

Before: 3-35 uses per donor across 22 majors. After: 8-10, every major
represented, no card's phrases dominating. `npm run build` passes; all
`data/v4/*.json` remain valid JSON. Checked Wheel of Fortune's node-6
live - "A real choice stands in front of you" (a Lovers-donated phrase)
in place of what used to be a Fool-sourced repeat.
