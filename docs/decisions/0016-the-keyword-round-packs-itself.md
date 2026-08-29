# 0016 — A card's first meeting is three keywords, and the round packs to fit

**Date:** 2026-08-29
**Status:** Accepted

## Context

`0014` gave A1 every one of a card's keywords. The Fool has seven, which came
out as twelve chips over four lines.

Tia, playing it: *"maybe no more than two lines of options, and it doesnt need
to show every single keyword, we couldn't expect them to learn all 7 at once
right, esp so early."*

Two separate problems in one sentence.

## Decision — the core set

**A first meeting asks for at most three keywords**, taken in the CSV's own
`keyword_order`, so they are the ones the guidebook leads with. This is `0012`
("depth arrives after the gist") applied to keywords: the rest are on the
card's page in the deck, where the learner finds them when they go looking.

Asked directly, Tia chose to teach the same three rather than show all seven
and test three — so `getCardIntro` serves the core set too. The teaching screen
says "you'll be quizzed on them next" (`0015`), and now that is exactly true.

There is no second pass. Each card gets one keyword round in the whole course —
78 rounds, 78 cards — so a keyword the round drops is a keyword the lesson
never asks for. That is the trade this decision makes deliberately: three
keywords a learner keeps beat seven they saw once.

## Decision — the packer

"No more than two lines" cannot be a chip count. *levity* and *openness of the
heart* do not cost the same, and at a 390px viewport the container is 350px
wide — about two or three chips per line. Measured across the deck, a fixed
seven chips put 65 of 78 rounds over two lines; even five left ten over.

So the round packs its own set. It starts at three keywords and four
distractors — one more wrong than right, so the answer is never simply "take
half" — and takes chips off until it fits: distractors first down to two, then
keywords down to two. A few minor-arcana cards keep whole clauses as keywords
(*inner obstruction we cause ourselves*), and five rounds still don't fit at
that floor; those render one size down rather than spill.

The result across all 78: four to six chips, two or three correct, five rounds
compact, and **every round two lines or fewer** at 390px — one line at desktop
width for twelve of them.

**The width numbers are an upper bound, not a fit.** Every one of the 206
distinct chips the deck can produce was measured in a browser at both sizes,
and the constants in `chipWidth` are the tightest line sitting above all of
them. A least-squares fit was tried first and failed: a proportional font puts
*community* four pixels above its own trend line, and one round packed to
exactly 350px in estimate and 358px in fact, which is the difference between
two rows and three.

`check_rounds.mjs` imports the same `fitsTwoRows` the packer uses — not a
second copy that can drift — and fails the build if any round spills. The
intro screen derives its keywords from the round's own correct chips rather
than recomputing the core, so the two can never disagree.

## Consequences

**A2 gets harder again.** `0013` and `0015` already left A2's four openers as
text the learner has never seen; now they have to be inferred from as few as
two keywords. Still the right shape of exercise, but it is the second time this
week the answer has moved further from the teaching, and it is worth playing a
full unit before adding anything else to that pile.

**The measurement is style-coupled.** Change `.chip`'s font size or padding and
the constants are wrong. The checker will say so, which is the point, but the
fix is to re-measure rather than to nudge the numbers until the build passes.

**Cards with long keywords teach less.** 28 rounds ask for two keywords rather
than three, because the deck's own phrasing is long. That is the content's
shape, not a rule — the full set is still on the card page.
