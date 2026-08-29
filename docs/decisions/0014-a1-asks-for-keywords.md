# 0014 — A1 shows the card and asks for its keywords

**Date:** 2026-08-29
**Status:** Accepted

## Context

A1 as specified is *Choose Card From Keywords*: a set of keywords sits at the
top, four card images sit below, tap the one they describe. Played, it is
easier than it looks. The four candidates are four pictures; the keywords name
one of them; recognising the picture you were just shown a moment ago in the
intro is a memory test with a five-second half-life. Nothing about the round
requires the learner to hold the meanings.

Tia, playing the first section: *"i think we should flip this lesson around.
it should show the fool card and lists some options for keywords that are
assosiated with it, no more than 10 and obviously some should be wrong."*

She is right, and the reason is worth writing down. Recognition runs one way
much more cheaply than the other. Picking a picture out of four is recognition;
deciding, keyword by keyword, whether *this* word belongs to *this* card is
recall against a set — you cannot do it by elimination, because every wrong
answer left standing costs you too.

## Decision

A1 renders the card face up with its name, and offers its keywords mixed with
five wrong ones. The learner selects every keyword that belongs and confirms
once.

**Scoring is one shot.** Check reveals the whole board at once — what you got
(solid green), what you took that doesn't belong (red, struck through), what
you left behind (dashed green) — and then the round ends. It does not ask for
another attempt. Hunting for an exact combination one guess at a time is
tedious in a way the other formats are not, and the learning is in seeing the
finished set laid out beside the card, not in converging on it. Anything short
of the exact set counts as a miss and queues the node for the second look.

**Five distractors, chosen for shape as well as source.** Distractors come
first from the other cards in the node — the confusables the curriculum itself
put in the room — and then from the wider deck. Two constraints apply.

The deck shares 31 keywords across more than one card; *exploration* alone
belongs to six, The Fool among them. A distractor is therefore rejected if it
is one of the target's own keywords, and `check_rounds.mjs` fails the build if
one slips through: marking a right answer wrong is worse than an easy round.

And keywords vary in shape — one word to a short phrase — while a single
card's set is usually consistent. Drawn without regard to that, the first
build gave The Fool seven single words beside *the discovery of the inner
world* and *break from dependence*. That is not a question about meaning; it
is a question about length. Candidates whose word count falls inside the range
of the card's own keywords are now taken first, and looser ones only fill a
gap. Across all 78 keyword rounds, no distractor now falls outside that range.

**The hint takes one wrong keyword out of play**, as it eliminates a wrong
candidate elsewhere, and — as in `0010` — a hinted round that is then answered
exactly still counts as clean.

**The reveal is one sentence.** The intro screen has just shown the full
condensed entry; repeating it under the answer is noise, and `0013` was written
about exactly this. It serves the opener.

## Consequences

This amends two specs, both deliberately, both narrowly.

**UX Style Guide §1 — "Only one option may be selected at a time."** That rule
governs single-answer rounds, and every other format in the app still obeys it.
This question has seven answers; a set is the honest input for it. Format K is
the only multi-select round, and if a second one ever appears the rule should
be rewritten rather than exempted twice.

**The Lesson Format Bible's name for A1.** The screen would otherwise be
labelled "Choose Card From Keywords" while doing the opposite, so the round
carries its own label, *Choose Keywords From Card*. The format code stays A1:
the curriculum row, its position in the ramp, and its data source are all
unchanged — only the direction of the question moved.

The anonymised-description variant of A1 (`description_anonymized`, from
`0013`) is untouched and still renders the original way; only the keyword
variant flipped.

78 of 1081 instances are keyword rounds: 7–12 chips each, median 9, with 2–7
correct.
