# 0092: Every cloze round carries at least 2 distractors

## The problem

Simon (screenshot of Empress's own node-3): a fill-in-the-blank round with
only one word in the bank besides the answer - "abundance" and "beanie,"
nothing else. Auditing every cloze round's own `distractors` array across
all 22 cards found 24 with exactly 1: all seven of Empress's node-3, all
six of Emperor's node-4, all five of Lovers' node-4, all six of Magician's
node-4. All four are hand-authored cards that predate `0086`'s
blank-count/distractor-scaling logic - the 17-card generator's own cloze
rounds already carried 2+ throughout.

## The fix

Added exactly one more distractor to each of the 24, drawn from the same
`SILLY_WORDS` pool the generator itself draws from, respecting `0088`'s
existing whole-course caps (no word more than 5 times total, 2 times per
card) - recomputed against the *current* baked state so the new picks
don't push anything already near a cap over it. The existing single
distractor in each round (real hard-keyword or silly word alike) is left
as-is; this only adds a second slot, never replaces the first.

## A caught-in-passing regression

Rerunning `build-v4-new-cards.mjs` for `0091`'s donor-card fix reset
`drawSillyWords()`'s own module-level usage counters to empty for that
run, same shape of problem `0091` itself just fixed for donor cards but
this time for silly words - the generator only knows about its own 17
cards' usage within one run, not what's already baked into the 5 static
hand-authored files, so regenerating node-1/node-3/node-7-recap/capstone
content pushed several words (pizza, teacup, elephant, umbrella, bicycle)
to 7 course-wide uses, over `0088`'s own cap of 5. Caught by re-running
this task's own audit before committing, not by a user report. Fixed by
re-running `rebalance_silly_distractors.py` against the final state -
exactly the second-pass step `0088`'s own verification already called for
after any generator rerun, missed this time when `0091` only re-ran the
donor rebalance and not the silly-word one alongside it.

## Verification

Zero cloze rounds under 2 distractors; silly-word caps back to max 5
global / 2 per-card; donor-card spread from `0091` unaffected (8-10 range
holds, since the silly-word rebalance only touches `words`/`cloze`
distractor arrays, never choice/swipe options). `npm run build` passes;
all `data/v4/*.json` remain valid JSON.
