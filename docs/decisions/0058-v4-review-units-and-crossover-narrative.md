# 0058 — v4: two cumulative-review units, and a Dave/Riley crossover

**Date:** 2 Sep 2026
**Status:** Accepted

## Context

`0057`'s six units each carried a full 7-node lesson set per card, three of
which are "more of the same round type, one difficulty tier up" than the
node right before them (v3 already leans on a lot of plain keyword-tap
drilling at escalating difficulty). Simon's call: trim each card's lessons
to 5, and spend the two freed nodes per card on two new units that pull
from all three cards together — closer to what `Spec_Curriculum_Design.md`
calls a unit recap, done here across units instead of within one.

## What got cut, and where it went

Two of each card's seven v4 nodes are dropped from units 1-6 — the two
that are hardest-tier repeats of an earlier node's own round type, not a
new concept:

| Card | Cut | Kept (5) |
|---|---|---|
| Fool | "More New Words", "Hardest Matches" | Meet the Fool, First Words, Readings Filled In, Closer Distractors, The Full Picture |
| Lovers | "Obvious Wrong Answers", "Real-Word Confusables" | Meet the Lovers, First Words, Readings Filled In, Opposites, The Full Picture |
| Empress | "Obvious Wrong Answers", "Real-Word Confusables" | Meet the Empress, More New Words, Readings Filled In, Opposites, The Full Picture |

Units 7 and 8 each get three lesson steps — one of the cut nodes from
each of the three cards (unit 7 takes the first cut node per card, unit 8
the second, so unit 8 reads as the harder of the two review passes).
Critically, these are **not** a new merged data file: `data/v4/*_section.
json` still holds all 7 nodes per card, untouched, and a review unit's
lesson step just links straight at that exact node's own existing route
(`/v4/play/<card>/<n>`). This matters because `NodeSession` takes a
single `cardKey`/`cardName` per *section*, used for every round's own
reference-card art inside it — a genuinely mixed-card node would show the
wrong card's art for two-thirds of its own rounds. Reusing the original
per-card route sidesteps that entirely.

## A crossover, not two more solo units

Simon's brief: a narrative with Dave at the start and Riley at the end,
their stories intertwining "in a funny but platonic way." `chapter-
player.jsx` already resolves which character's art to show from the
*current beat's own* `character` field, not a single chapter-level value
(`const character = beat?.character ?? ...`) - so a chapter can already
have Dave speak, then Riley, without any engine change. `u7-dave-end.json`
uses exactly that: Dave finishes his own review, Riley's arriving for
hers, they meet in the doorway, get asked the obvious question ("so are
you two...?"), answer "No" in unison, and it turns out Dave's furniture
business and Riley's tour just solved each other's actual problem (stage
risers). `u8-riley-start.json` picks up immediately after on Riley's own
side, and `u8-riley-end.json` closes out both the review and the whole
Story mode arc for both characters at once.
