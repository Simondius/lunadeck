# 0088: No silly distractor word repeats more than twice in a card or five times in the course — and a real regression this caused, caught and fixed

## The repeat cap

Simon noticed "Tuesday" and "banana" everywhere and asked for an audit,
then a fix: no single distractor word more than twice within one card,
five times across the whole course. The audit confirmed it — `SILLY_WORDS`
was an 8-word array indexed by fixed position (`SILLY_WORDS[0]`,
`SILLY_WORDS[1]`, ...) in node-1, node-3, and the capstone's own plain
round, identically for every one of the 17 cards this generator produces.
"Tuesday" and "banana" alone accounted for 74 of 392 total silly-word
slots across the whole course.

Consolidated `SILLY_WORDS` into one 122-word pool and replaced every fixed
index with `drawSillyWords(cardKey, count)` — a round-robin allocator
tracking both a global usage count (cap 5) and a per-card usage count
(cap 2), shared module-level state so the caps hold across all 17 cards in
one script run, not just within one. `0086`'s own separate
`CLOZE_DISTRACTOR_WORDS` pool and `drawClozeDistractors` are gone,
absorbed into this single pool/allocator — there was no reason for cloze
and plain-round distractors to draw from different pools once both need
the same caps enforced together. The five pre-existing hand-authored cards
(Fool, Lovers, Empress, Magician, Emperor) needed a separate one-off
script (`rebalance_silly_distractors.py`, run once) since they're not part
of this generator and CLAUDE.md's own rule says not to regenerate them —
it rebalances every silly-word slot across all 22 cards together, keeping
each card's own already-compliant choices where possible and only
replacing what's over either cap.

## The regression this surfaced

Rerunning `build-v4-new-cards.mjs` for this fix — and, it turned out, for
`0086` and `0087` before it — silently wiped node-2's real element data
(wired in separately, not through this script, after `0078`/`0079`) back
to the original placeholder for all 17 cards, since `buildSection` always
built node-2 fresh regardless of what already existed. This had already
happened twice before Simon caught it from a live screenshot showing "The
Wheel of Fortune" back to "Element pending" placeholder text.

Root cause: the generator's own comment still called node-2 "a deliberate
placeholder" long after real data existed for every card it produces — the
one-off wiring pass updated the *output* files but never the *generator*,
so anyone (including future-me) rerunning it for an unrelated reason had
no signal they were about to destroy real content.

Fixed at the source this time, not just patched in the output:
`existingNode2(slug)` reads whatever node-2 currently sits in a card's own
output file and reuses it verbatim unless it still contains the literal
placeholder marker text — only a card that's never had real data wired in
falls back to building the placeholder. Verified by rerunning the script
twice in a row after restoring the wiped data from git history (commit
`591d7eb`, the last commit before the wipe) and confirming node-2 survives
identically both times.

## A minimum distractor count while we're in here

Separately, Simon: every "words" round should carry at least 2
distractors, 3 where there's room. Auditing turned up exactly one
offender: the capstone's own plain round asked `drawSillyWords` for just
1, unlike node-1/node-3/node-4's own 2-6 - bumped to 3, comfortably
supported by the bigger pool above. Every other "words" round in the app
already met the 2-minimum.

## Verification

Restored node-2 (both its zone and tilematch rounds) for all 17 affected
cards from `591d7eb`, including re-applying the High Priestess's own
four-moon-rects fix (`0085`) on top, since that landed after `591d7eb` and
was wiped by the same regression. Reran the generator twice consecutively
— node-2 identical both times, zero placeholder markers remaining. Ran
`rebalance_silly_distractors.py` against the final state, then again after
the distractor-count bump below: 431 total silly slots, 172 unique words,
max global usage 5, max per-card usage 2, zero "words" rounds left under 2
distractors. All 22 section files and `capstone_nodes.json` remain valid
JSON; `npm run build` passes. Checked Wheel of Fortune's node-1 live —
real, varied distractors ("puddle," "geyser"), not "Tuesday"/"banana."
