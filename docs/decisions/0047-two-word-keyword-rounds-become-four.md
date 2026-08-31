# 0047 — v3's 2-word keyword rounds become 4-word

**Date:** 31 Aug 2026
**Status:** Accepted

## Context

Simon asked to replace every 2-word keyword round (one correct keyword, one
distractor) with a 4-word version: two correct keywords, two distractors.
This is a content change, and `CLAUDE.md` is explicit that keywords come
from the source guidebook, not from whoever's editing the file — so the
question wasn't just "add a word," it was "add a word from where."

`data_card_keywords.csv` is the answer: each of these five cards already has
5-7 official keywords, and the existing 2-word rounds were only ever testing
one at a time. There was room to test a second real keyword in the same
round without inventing anything.

## What actually changed

Every round in `data/v3/*_section.json` that had exactly two `words` (67 of
them, across all five cards) gained a second correct word and a second
distractor. v2's own copies are untouched, same as every other v3-only
change so far.

**The second correct keyword** comes from that card's own official list
(`data_card_keywords.csv`), rotated deterministically: a round testing the
keyword at position *i* pairs it with the keyword at position *i + 1*
(wrapping around the list), shifting by one more each time that same
keyword recurs in another round, so repeats don't all pair with the same
partner. Nothing invented - every second word is a real keyword for that
card, sourced the same place the first one was.

**The second distractor matches the round's existing tier**, identified
mechanically: a round whose original distractor is one of the pool of
23 stand-in nonsense words already reused throughout this exercise
(`banana`, `Tuesday`, `elephant`, ... - the same words `0035`'s content
already leaned on for "obviously wrong") gets a second word from that same
pool. A round whose distractor is a real antonym (`0035`'s "closer
distractors" tier - `seriousness` against `levity`, `naivety` against
`shrewdness`, and so on) gets a second antonym - but not a new one.

Every one of these cards already has exactly one antonym-tier round per
keyword (verified: the antonym-tier round count equals the card's own
keyword count, for all five). So the second antonym a round needs is
always something the card's *own* content already established somewhere
else in that same tier - literally look up what round X already paired
with keyword Y, and reuse that pairing here. Zero new antonyms were
written; every one already existed in this card's own data before this
change.

## What didn't change

The 6-word tiers (`0035`'s "obvious wrong answers" and "real-word
confusables") were already testing three keywords at once and are
untouched - Simon's ask was specifically about the 2-word tier. Round
count, round order, round ids, and every other field are unchanged; only
`words` grew from 2 entries to 4 on the rounds this applied to.

## A side effect: `0046`'s auto-advance fix needed its threshold moved

`0046` made 2-word rounds skip the Continue button and advance straight
through once the round's own pop animation finished, gated on
`round.words.length === 2`. After this change there are no 2-word rounds
left in v3, which would have silently reverted every one of them back to
showing the button - not requested, and not obviously right or wrong on
its own, but a real behavior change riding along with a content edit, so
it's called out here rather than left to be noticed later. Moved the gate
to `<= 4`: the same "simple" tier auto-advances now at four words instead
of two, and the 6-word mastery tiers still get the button, preserving
`0046`'s actual intent rather than its literal number.

## Verified

A script confirmed, for all five cards: no round ended up with a duplicate
word, no round has an uneven correct/wrong split, and every previously
2-word round is now exactly 4 words (6-word rounds untouched: 20+11+11+14+11
= 67 rounds affected, matching the count of 2-word rounds found before the
change). `npm run build` succeeds across all routes. Loaded a nonsense-tier
round (Fool, node 4) and an antonym-tier round (Lovers, node 8) in a real
browser: four chips render and wrap cleanly in both cases, with no console
errors.

## Known gaps, honestly

Nobody has actually played through a full node with four keyword chips
instead of two - the layout was checked static, not played. And the
rotation that picks each round's second keyword is mechanical, not
curated; it guarantees no duplicates and real coverage, but nobody has
checked whether any specific pairing reads oddly next to its distractors
(a keyword and its own antonym-of-a-different-keyword sitting side by
side, for instance). Worth a playtest pass, same as `0046` itself still
needs one.
