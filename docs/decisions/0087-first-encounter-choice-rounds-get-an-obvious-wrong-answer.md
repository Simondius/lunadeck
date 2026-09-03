# 0087: A card's first (only) teaching unit gives its "Pick the True Reading" rounds an easy way in

## Context

Simon: node-6 ("Pick the True Reading") and the capstone's own choice
round should carry at least one obviously-wrong option on a card's first
teaching unit — one in a 3-option round, two in a 4-option round — rather
than every wrong answer being maximally confusable.

`otherCardNotes()` always drew a choice round's wrong options from the
*most* similar other majors (sorted by `data_card_similarity.csv`'s own
score), by design, for node-4's "Closer Distractors." Node-6 and the
capstone's choice round reused the exact same function, which meant every
wrong answer on a learner's very first encounter with a card was already
hard-mode — no easier option to eliminate first, unlike node-1's own
keyword round, which has always paired real keywords with plainly silly
ones for exactly this reason.

## Fix

A new `SILLY_SENTENCES` pool (30 invented, genuinely nonsensical full
sentences — "Its meaning resets every time someone sneezes nearby," "Was
shuffled in from a completely different deck by accident") and a
`drawSillySentences(count)` round-robin allocator, same shape as `0086`'s
own cloze-distractor pool. Unlike every other distractor in this app,
these are deliberately *not* grounded in real card content — the entire
point is that nothing about them should read as plausibly true of any
real card, the same role `SILLY_WORDS` already plays for keyword rounds.
Full sentences throughout, per `0080`'s own rule.

Node-6 now draws one genuinely confusable real wrong (`otherCardNotes`,
still never repeating one already used elsewhere in the unit) plus two
silly ones — a 4-option round, same total as before, different mix. The
capstone's own choice round: one real wrong plus one silly one, in its
3-option round. `choice-round-player.jsx` already shuffles option order
at render time, so where the silly options sit in the underlying data
doesn't matter.

Every card this generator produces only has one teaching unit (0078,
0079's own "no new card is taught twice" design for units 9-27), so this
applies unconditionally to all 17 cards it built — there's no separate
"second, harder encounter" version of this content to preserve. The
review units' own mashup content (`data/v4/mashup_nodes.json`, testing
already-known cards) is untouched — full-difficulty distractors are the
correct call there.

## Verification

Checked Chariot's own node-6 live: each round now shows one plausible
wrong answer and two unmistakably absurd ones, alongside the correct
reading. `npm run build` passes; all 17 regenerated section files and
`capstone_nodes.json` remain valid JSON.
